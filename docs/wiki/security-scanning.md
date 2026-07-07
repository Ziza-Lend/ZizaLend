# Security Scanning

ZizaLend uses Trivy to scan container images for known vulnerabilities (CVEs) during the deployment process to staging and production.

## Exception Process (.trivyignore)

If a vulnerability is flagged but is considered a false positive, not applicable to our environment, or an acceptable risk while waiting for a patch, you can add it to the `.trivyignore` file located at the root of the repository.

### How to ignore a vulnerability:

1. Open `.trivyignore`.
2. Add a comment explaining **why** the vulnerability is being ignored and, if applicable, until when.
3. Add the CVE identifier on the next line.

Example:
```
# Not vulnerable in our configuration because we do not use the affected feature.
# See issue #123
CVE-202X-XXXXX
```
