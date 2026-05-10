"""Quick environment sanity check for newco.

Run after cloning and installing requirements:
    python scripts/setup_check.py

Confirms Python version and that the four core libraries import cleanly.
"""

import sys


def main() -> int:
    print(f"Python: {sys.version.split()[0]}")
    print(f"Executable: {sys.executable}\n")

    checks = [
        ("pandas", "pandas"),
        ("ydata-profiling", "ydata_profiling"),
        ("pm4py", "pm4py"),
        ("lifelines", "lifelines"),
    ]

    failed = []
    for display_name, module_name in checks:
        try:
            mod = __import__(module_name)
            version = getattr(mod, "__version__", "unknown")
            print(f"  OK   {display_name:<20} {version}")
        except ImportError as e:
            print(f"  FAIL {display_name:<20} {e}")
            failed.append(display_name)

    print()
    if failed:
        print(f"FAILED: {', '.join(failed)}")
        print("Check requirements.txt is installed and venv is activated.")
        return 1
    print("All good.")
    return 0


if __name__ == "__main__":
    sys.exit(main())