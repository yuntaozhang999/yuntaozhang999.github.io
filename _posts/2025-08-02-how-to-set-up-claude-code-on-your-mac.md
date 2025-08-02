---
title: 'How to Set Up Claude Code on Your Mac'
date: 2025-08-02
excerpt: ""
tags:
  - Claude Code
  - MacOS
  - AWS
  - Bedrock
  - npm
  - Yuntao Zhang

---
# How to Set Up Claude Code on Your Mac

## Overview

This guide will help you set up Claude Code to work with your company's AWS Bedrock environment. Instead of connecting directly to Anthropic's platform, we'll be using Claude models hosted on AWS Bedrock, which requires proper AWS authentication and configuration.

### Understanding the Architecture

Before we begin, let's understand what we're setting up:

* **Claude Code**: A JavaScript application that provides a command-line interface to Claude AI.
* **AWS Bedrock**: Amazon's AI service platform where our company hosts Claude models.
* **AWS CLI**: Command-line tool to authenticate and communicate with AWS services.
* **Node.js/npm**: JavaScript runtime and package manager needed to run Claude Code.

---

## Step-by-Step Installation

### 1. Install Node.js and npm

First, install Node.js (npm comes automatically with Node.js):

```sh
brew install node
````

**What this does:**

  * Installs Node.js JavaScript runtime environment.
  * Automatically includes npm (Node Package Manager).
  * Provides the foundation for running JavaScript applications like Claude Code.

### 2\. Install Claude Code

```sh
npm install -g @anthropic-ai/claude-code
```

**What this does:**

  * Downloads and installs Claude Code globally (`-g` flag).
  * Makes the `claude` command available in your terminal.
  * **Note**: The package name is `@anthropic-ai/claude-code`, but the command is just `claude`.

### 3\. Install AWS CLI

```sh
brew install awscli
```

**What this does:**

  * Installs AWS Command Line Interface.
  * Enables authentication with AWS services.
  * Required for accessing AWS Bedrock where our Claude models are hosted.

### 4\. Configure AWS Profile

Create or edit the `~/.aws/config` file with the following content:

```ini
[profile claude-code]
sso_start_url = [https://your-company-sso.awsapps.com/start](https://your-company-sso.awsapps.com/start)
sso_account_id = YOUR_AWS_ACCOUNT_ID
sso_role_name = YOUR_SSO_ROLE_NAME
region = us-east-1
output = json
sso_region = us-east-1

[profile claude-code-two]
role_name = YOUR_SSO_ROLE_NAME
account_id = YOUR_AWS_ACCOUNT_ID
source_profile = claude-code
```

**What this does:**

  * Defines AWS configuration profiles for SSO (Single Sign-On) authentication.
  * Contains your company's AWS account information and SSO settings.
  * The AWS CLI reads this file to know how to authenticate you.
  * **Note**: Replace the placeholder values with your actual company information:
      * `YOUR_AWS_ACCOUNT_ID`: Your company's AWS account ID.
      * `YOUR_SSO_ROLE_NAME`: Your company's SSO role name.
      * `https://your-company-sso.awsapps.com/start`: Your company's SSO start URL.

### 5\. Set Environment Variables

Add these lines to your `~/.zprofile` file:

```sh
# Enable Bedrock integration (env variable for Claude)
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_PROFILE=claude-code
export ANTHROPIC_MODEL='us.anthropic.claude-sonnet-4-20250514-v1:0'
```

**What each variable does:**

  * `CLAUDE_CODE_USE_BEDROCK=1`: Tells Claude Code to use AWS Bedrock instead of connecting directly to Anthropic.
  * `AWS_PROFILE=claude-code`: Tells AWS CLI which configuration profile to use.
  * `ANTHROPIC_MODEL='us.anthropic.claude-sonnet-4-20250514-v1:0'`: Specifies which Claude model version to use.

### 6\. Reload Your Shell Configuration

```sh
source ~/.zprofile
```

**What this does:**

  * Loads the new environment variables into your current terminal session.
  * Makes the settings available immediately without restarting your terminal.

-----

## How to Use Claude Code

### Daily Authentication (Required)

Every time you want to use Claude Code (or when your session expires), run:

```sh
aws sso login --profile claude-code
```

**What happens during authentication:**

1.  The AWS CLI reads your `claude-code` profile from `~/.aws/config`.
2.  It opens your browser to the company SSO login page.
3.  You enter a device code shown in the terminal.
4.  AWS verifies your company identity.
5.  AWS returns temporary access tokens (valid for \~8 hours).
6.  Tokens are cached in `~/.aws/sso/cache/` for automatic use.

### Start Claude Code

Once authenticated, simply run:

```sh
claude
```

**What happens when you run this:**

1.  Claude Code checks your environment variables.
2.  Sees `CLAUDE_CODE_USE_BEDROCK=1` and decides to use AWS Bedrock.
3.  Sees `AWS_PROFILE=claude-code` and uses this AWS configuration.
4.  Uses cached AWS tokens to connect to AWS Bedrock.
5.  Accesses the specified model: `us.anthropic.claude-sonnet-4-20250514-v1:0`.
6.  Starts an interactive chat session.

-----

## Verify Your Setup

Check if your AWS authentication is working:

```sh
aws sts get-caller-identity
```

This should return something like:

```json
{
    "UserId": "AROXXXXXXXXXXXXXXXXX:yourusername",
    "Account": "YOUR_AWS_ACCOUNT_ID",
    "Arn": "arn:aws:sts::YOUR_AWS_ACCOUNT_ID:assumed-role/AWSReservedSSO_YOUR_SSO_ROLE_NAME_HASH/yourusername"
}
```

Check your environment variables:

```sh
echo "CLAUDE_CODE_USE_BEDROCK: $CLAUDE_CODE_USE_BEDROCK"
echo "AWS_PROFILE: $AWS_PROFILE"
echo "ANTHROPIC_MODEL: $ANTHROPIC_MODEL"
```

-----

## Troubleshooting

### Common Issues

1.  **"command not found: claude"**

      * Make sure you installed Claude Code globally: `npm install -g @anthropic-ai/claude-code`.
      * Check if the npm global bin directory is in your `PATH`.

2.  **"The config profile could not be found"**

      * Verify your `~/.aws/config` file has the correct profile configuration.
      * Make sure the `AWS_PROFILE` environment variable matches an existing profile name.

3.  **Authentication expired**

      * Run `aws sso login --profile claude-code` again.
      * AWS tokens typically expire after 8 hours.

4.  **Claude not responding**

      * Check if you're authenticated: `aws sts get-caller-identity`.
      * Verify environment variables are set correctly.
      * Make sure `CLAUDE_CODE_USE_BEDROCK=1` is set.

### File Locations

  * **AWS configuration**: `~/.aws/config`
  * **AWS SSO cache**: `~/.aws/sso/cache/`
  * **Shell configuration**: `~/.zprofile` (or `~/.zshrc`)
  * **Claude Code installation**: `/opt/homebrew/lib/node_modules/@anthropic-ai/claude-code/`

-----

## Summary

This setup creates a secure connection from your Mac to your company's Claude models hosted on AWS Bedrock. The authentication happens through your company's SSO system, and once configured, you can use Claude Code with a simple `claude` command after authenticating with AWS SSO.

**Remember**: You need to run `aws sso login --profile claude-code` whenever your AWS session expires (typically every 8 hours), but all other configurations are permanent.