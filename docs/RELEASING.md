# Release Process

This document outlines the release process for the Nuxt UTM module.

## Release Workflow

We follow a two-step release process:

1. **Manual Release Preparation (Local)**:

   - Version bump
   - CHANGELOG update
   - Tag creation
   - Git commit

2. **Automated NPM Publishing (GitHub Actions)**:
   - Triggered by the newly created release/tag
   - Builds and publishes the package to NPM

## Manual Release Steps

To create a new release:

1. Ensure you have the latest changes from the main branch:

   ```bash
   git checkout main
   git pull origin main
   ```

2. Make sure all tests pass:

   ```bash
   yarn test
   ```

3. Run the release script, which will:

   - Bump the version in package.json
   - Update the CHANGELOG.md
   - Create a git tag
   - Commit changes

   ```bash
   yarn release
   ```

4. Push the changes including the new tag:
   ```bash
   # This will be done automatically by the release script
   ```

## Automated NPM Publishing

After the manual release process:

1. GitHub Actions workflow [npm-publish.yml](../.github/workflows/npm-publish.yml) will be triggered automatically when:

   - A new GitHub release is created
   - OR manually triggered via workflow_dispatch

2. The workflow will:
   - Check out the repository
   - Set up Node.js
   - Install dependencies
   - Build the module
   - Publish to NPM using the credentials stored in GitHub secrets

## Version Numbering

We follow [Semantic Versioning](https://semver.org/) for this project:

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

## Troubleshooting

If the automated publishing fails:

1. Check the GitHub Actions logs for errors
2. Ensure the `npm_token` secret is correctly set in the repository settings
3. Verify that the version in package.json hasn't already been published

## Additional Notes

- The release process uses [changelogen](https://github.com/unjs/changelogen) to generate CHANGELOG entries
- Always verify that the published package works correctly by installing it in a test project

---

For questions or assistance with the release process, please contact the maintainers or email [community@stackbuilders.com](mailto:community@stackbuilders.com).
