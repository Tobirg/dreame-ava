#!/usr/bin/env python3
"""List candidate registration sites in a local, symbol-rich AArch64 AVA ELF.

This is linear static analysis, not execution or control-flow emulation.
Review inferred bindings before using them. No robot access is performed.
Requires: pip install pyelftools capstone
"""
import argparse
import csv
import hashlib
import re
import sys

from capstone import Cs, CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN
from elftools.elf.elffile import ELFFile


def extract(filename):
    with open(filename, "rb") as source:
        elf = ELFFile(source)
        if elf.get_machine_arch() != "AArch64":
            raise ValueError("Expected an AArch64 ELF")
        dyn = elf.get_section_by_name(".dynsym")
        text = elf.get_section_by_name(".text")
        symbols = list(dyn.iter_symbols())
        labels = {s["st_value"]: s.name for s in symbols if s["st_value"]}
        plt = elf.get_section_by_name(".plt")
        for index, relocation in enumerate(elf.get_section_by_name(".rela.plt").iter_relocations()):
            labels[plt["sh_addr"] + 32 + 16 * index] = dyn.get_symbol(relocation["r_info_sym"]).name
        got = {r["r_offset"]: dyn.get_symbol(r["r_info_sym"]).name
               for r in elf.get_section_by_name(".rela.dyn").iter_relocations()
               if r["r_info_sym"]}
        disassembler = Cs(CS_ARCH_ARM64, CS_MODE_LITTLE_ENDIAN)
        seen = set()
        rows = []
        for symbol in symbols:
            match = re.match(r"_ZN13avanodemsgcvt\d+(Msg\w+)C2E", symbol.name)
            if not match or not symbol["st_value"] or not symbol["st_size"]:
                continue
            if symbol["st_value"] in seen:
                continue
            seen.add(symbol["st_value"])
            service = match[1]
            registers = {}
            literal_id = None
            siid = None
            candidates = []
            offset = symbol["st_value"] - text["sh_addr"]
            body = text.data()[offset:offset + symbol["st_size"]]
            for ins in disassembler.disasm(body, symbol["st_value"]):
                args = ins.op_str.split(", ")
                if ins.mnemonic == "adrp":
                    registers[args[0]] = int(args[1].lstrip("#"), 0)
                elif ins.mnemonic == "ldr" and len(args) >= 2:
                    base = args[1].lstrip("[").rstrip("]")
                    displacement = int(args[2].lstrip("#").rstrip("]"), 0) if len(args) == 3 else 0
                    target = got.get(registers.get(base, -displacement - 1) + displacement, "")
                    member = re.match(r"_ZN13avanodemsgcvt\d+" + service + r"(\d+)(\w+)", target)
                    if member:
                        length = int(member[1])
                        candidates.append(member[2][:length])
                    # Do not reuse a page address after loading through that register.
                    registers.pop(args[0], None)
                if ins.mnemonic == "mov" and args[0] == "w1":
                    literal_id = int(args[1].lstrip("#"), 0) if args[1].startswith("#") else None
                if ins.mnemonic != "bl":
                    continue
                called = labels.get(int(ins.op_str.lstrip("#"), 0), "")
                if "MsgHandlerC2E" in called:
                    siid = literal_id
                    candidates = []
                kind = re.search(r"MsgHandler13Add(Get|Set|Act|Rpt)Handler", called)
                if kind:
                    rows.append({"service": service, "siid": siid,
                                 "operation": kind[1].lower(), "iid": literal_id,
                                 "handler_candidate": candidates[-1] if candidates else "",
                                 "candidate_count": len(candidates),
                                 "registration_va": hex(ins.address),
                                 "constructor_va": hex(symbol["st_value"])})
                    candidates = []
        return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("elf", help="Local node_msg_cvt.so; never uploaded")
    args = parser.parse_args()
    with open(args.elf, "rb") as source:
        fingerprint = hashlib.file_digest(source, "sha256").hexdigest()
    rows = extract(args.elf)
    print("SHA256: " + fingerprint, file=sys.stderr)
    print("Candidate sites: " + str(len(rows)), file=sys.stderr)
    if not rows:
        raise ValueError("No matching registration sites; symbols/build may differ")
    writer = csv.DictWriter(sys.stdout, fieldnames=list(rows[0]), lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)


if __name__ == "__main__":
    main()
