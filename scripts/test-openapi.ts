#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import SwaggerParser from '@readme/openapi-parser';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the test OpenAPI spec
const OPENAPI_PATH = path.resolve(__dirname, '../docs/openapi-test-data/openapi.yaml');
const OUTPUT_JSON_PATH = path.resolve(__dirname, '../docs/openapi-test-data/parsed.json');

// Type for OpenAPI document structure
type OpenAPIDocument = {
  info?: {
    title?: string;
    version?: string;
    [key: string]: unknown;
  };
  servers?: Array<{ url: string; [key: string]: unknown }>;
  paths?: {
    [path: string]: {
      [method: string]: unknown;
    };
  };
  [key: string]: unknown;
};

async function main() {
  try {
    console.log(`🔍 Reading OpenAPI spec from: ${OPENAPI_PATH}`);
    
    // Parse, validate, and dereference the OpenAPI spec
    console.log('🔄 Parsing and validating OpenAPI spec...');
    const api = (await SwaggerParser.validate(OPENAPI_PATH)) as OpenAPIDocument;

    // Log basic info
    console.log('✅ OpenAPI spec is valid!');
    console.log(`📝 Title: ${api.info?.title || 'N/A'}`);
    console.log(`📚 Version: ${api.info?.version || 'N/A'}`);
    console.log(`🔗 Base URL: ${api.servers?.[0]?.url || 'N/A'}`);
    
    // Count paths and operations
    const pathCount = Object.keys(api.paths || {}).length;
    console.log(`📊 Paths: ${pathCount} endpoints`);
    
    // Count operations
    const operations = Object.values(api.paths || {}).flatMap(pathItem => {
      if (!pathItem || typeof pathItem !== 'object') return [];
      return Object.entries(pathItem).filter(([key]) => 
        ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'].includes(key)
      );
    });
    
    console.log(`🔄 Operations: ${operations.length} total`);

    // Save full parsed output for inspection
    await fs.writeFile(
      OUTPUT_JSON_PATH,
      JSON.stringify(api, null, 2),
      'utf-8'
    );
    
    console.log(`\n💾 Full parsed output saved to: ${OUTPUT_JSON_PATH}`);
    console.log('\n🎉 Done! You can inspect the full output in the file above.');
    
  } catch (error) {
    console.error('❌ Error processing OpenAPI spec:');
    if (error instanceof Error) {
      console.error(`  ${error.message}`);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack.split('\n').slice(0, 5).join('\n') + '\n  ...');
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main();
