"""Host-only checks; no ADB or robot access."""
from pathlib import Path
import runpy
import subprocess
import tempfile
import unittest
from unittest.mock import patch

MODULE = runpy.run_path(str(Path(__file__).parents[1] / "tools/install_network.py"))
SETTINGS = MODULE["network_settings"]


class NetworkSetupTest(unittest.TestCase):
    def test_prompt_defaults_to_dhcp(self):
        with patch.dict(SETTINGS.__globals__, prompt=lambda _: ""):
            self.assertEqual(SETTINGS(None, None), ("dhcp", ""))

    def test_static_mode_prompts_for_address(self):
        answers = iter(["static", "192.0.2.35/24"])
        with patch.dict(SETTINGS.__globals__, prompt=lambda _: next(answers)):
            self.assertEqual(SETTINGS(None, None), ("static", "192.0.2.35/24"))

    def test_address_implies_static_mode(self):
        self.assertEqual(SETTINGS(None, "192.0.2.35/24"), ("static", "192.0.2.35/24"))

    def test_dhcp_rejects_static_address(self):
        with self.assertRaises(ValueError):
            SETTINGS("dhcp", "192.0.2.35/24")

    def test_rejects_invalid_static_addresses(self):
        for value in ["192.0.2.35", "192.0.2.0/24", "192.0.2.255/24",
                      "127.0.0.1/8", "224.0.0.1/24", "::1/128",
                      "192.0.2.35/24'; echo injected"]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                SETTINGS("static", value)

    def test_worker_shell_syntax_for_both_modes(self):
        for mode, address in [("dhcp", ""), ("static", "192.0.2.35/24")]:
            body = MODULE["worker_script"](mode, address)
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as directory:
                script = Path(directory) / "worker.sh"
                script.write_text(body)
                subprocess.run(["sh", "-n", str(script)], check=True)


if __name__ == "__main__":
    unittest.main()
