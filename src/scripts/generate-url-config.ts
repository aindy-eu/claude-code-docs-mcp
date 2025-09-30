#!/usr/bin/env node
/**
 * Generate URL Configuration for Shell Scripts
 *
 * Outputs URL configuration in shell-friendly format for use in bash scripts.
 *
 * Usage:
 *   npm run generate-url-config > tools/url-config.sh
 */

import { docUrlService } from '../config/documentation-urls.js';

// Generate and output shell configuration
console.log(docUrlService.getShellConfig());
