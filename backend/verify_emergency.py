import sys
from pathlib import Path

# Set console output to UTF-8 to handle emojis on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parent))

from src.emergency import check_emergency

def run_tests():
    print("=== Testing Emergency Query Detection ===")
    
    test_cases = [
        # Emergency queries
        ("how to cure heart attack", True),
        ("a person head is bleeding what to do", True),
        ("chest pain what to do", True),
        ("HELP my friend is choking", True),
        ("he took poison what should we do immediately", True),
        ("my head is bleeding", True),
        ("having a stroke", True),
        ("bleeding heavily from leg", True),
        
        # Non-emergency (informational) queries
        ("what is a heart attack", False),
        ("symptoms of a stroke", False),
        ("causes of chest pain", False),
        ("history of blood transfusions", False),
        ("what is first aid", False),
        ("explain what happens during cardiac arrest", False)
    ]
    
    passed = 0
    failed = 0
    
    for query, expected_emergency in test_cases:
        res = check_emergency(query)
        is_emergency = res is not None
        
        if is_emergency == expected_emergency:
            print(f"[PASS] Query: '{query}' -> Expected Emergency: {expected_emergency}, Detected: {is_emergency}")
            passed += 1
        else:
            print(f"[FAIL] Query: '{query}' -> Expected Emergency: {expected_emergency}, Detected: {is_emergency}")
            if is_emergency:
                print(f"       Response received: {res[:60]}...")
            failed += 1
            
    print(f"\nSummary: {passed} passed, {failed} failed.")
    if failed > 0:
        sys.exit(1)
    else:
        print("All tests passed successfully!")
        sys.exit(0)

if __name__ == "__main__":
    run_tests()
