# firewall.py
import sys
import re
import bleach
import socket




def hasSqlInjection(username, password):
    # Check for common SQL injection patterns
    sql_injection_patterns = [
        "'; DROP TABLE",
        "'; SELECT * FROM",
        "--",
        "/*",
    ]

    for pattern in sql_injection_patterns:
        if pattern.lower() in username.lower() or pattern.lower() in password.lower():
            return True

    return False

def hasHttpsIssues(username, password):
    # Check for potential HTTPS-related security issues
    https_issue_patterns = [
        "https://",
        "secure",
        "ssl",
        ":443",
    ]

    for pattern in https_issue_patterns:
        if pattern.lower() in username.lower() or pattern.lower() in password.lower():
            return True

    return False

def performSecurityChecks(username, password):
    # Check for potential HTTPS-related security issues
    if hasHttpsIssues(username, password):
        return "HTTPS-related security issues detected"
    
    # Check for SQL injection
    if hasSqlInjection(username, password):
        return "SQL injection detected"

    # Check if inputs contain only alphanumeric characters
    if not username.isalnum() or not password.isalnum():
        return "Invalid characters detected"

    # Check if inputs meet minimum and maximum length requirements
    if len(username) < 3 or len(username) > 20 or len(password) < 1 or len(password) > 30:
        return "Invalid length of username or password"

    # Check if inputs match expected patterns using regular expressions
    username_pattern = re.compile("^[a-zA-Z0-9]+$")
    password_pattern = re.compile("^[a-zA-Z0-9]+$")

    if not username_pattern.match(username) or not password_pattern.match(password):
        return "Invalid characters in username or password"

    # Check for common weak passwords or patterns (customize as needed)
    common_weak_passwords = ["password", "123456", "qwerty"]
    if password.lower() in common_weak_passwords or username.lower() in common_weak_passwords:
        return "Common or weak password detected"

    # Check against a blacklist of known insecure values
    insecure_usernames = ["admin", "root"]
    if username.lower() in insecure_usernames:
        return "Insecure username detected"

    # Add more security checks as needed

    return "Security checks passed"

# Function to sanitize HTML content
def sanitize_html(content):
    return bleach.clean(content, tags=[], attributes={})

if __name__ == "__main__":
    num_args = len(sys.argv)

    if num_args == 3:
        # Expect sanitized username and password as command line arguments
        sanitized_username = sys.argv[1]
        sanitized_password = sys.argv[2]

        result = performSecurityChecks(sanitized_username, sanitized_password)
        print(result)

    elif num_args == 2:
        # Expect sanitized message as a command line argument
        sanitized_message = sanitize_html(sys.argv[1])
        print(sanitized_message)

    else:
        print("Invalid number of arguments. Expected either 2 or 3 arguments.")