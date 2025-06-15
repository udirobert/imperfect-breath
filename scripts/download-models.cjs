#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');
const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';

// Model files to download
const MODEL_FILES = [
  // Tiny Face Detector
  {
    name: 'tiny_face_detector_model.json',
    url: `${BASE_URL}/tiny_face_detector_model.json`
  },
  {
    name: 'tiny_face_detector_model-weights_manifest.json',
    url: `${BASE_URL}/tiny_face_detector_model-weights_manifest.json`
  },
  {
    name: 'tiny_face_detector_model-shard1',
    url: `${BASE_URL}/tiny_face_detector_model-shard1`
  },

  // Face Landmark 68
  {
    name: 'face_landmark_68_model.json',
    url: `${BASE_URL}/face_landmark_68_model.json`
  },
  {
    name: 'face_landmark_68_model-weights_manifest.json',
    url: `${BASE_URL}/face_landmark_68_model-weights_manifest.json`
  },
  {
    name: 'face_landmark_68_model-shard1',
    url: `${BASE_URL}/face_landmark_68_model-shard1`
  },

  // Face Expression
  {
    name: 'face_expression_model.json',
    url: `${BASE_URL}/face_expression_model.json`
  },
  {
    name: 'face_expression_model-weights_manifest.json',
    url: `${BASE_URL}/face_expression_model-weights_manifest.json`
  },
  {
    name: 'face_expression_model-shard1',
    url: `${BASE_URL}/face_expression_model-shard1`
  }
];

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  console.log('Created models directory:', MODELS_DIR);
}

// Download function
function downloadFile(fileInfo) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(MODELS_DIR, fileInfo.name);

    // Skip if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`✓ ${fileInfo.name} already exists`);
      return resolve();
    }

    console.log(`⬇️  Downloading ${fileInfo.name}...`);

    const file = fs.createWriteStream(filePath);

    https.get(fileInfo.url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log(`✅ Downloaded ${fileInfo.name}`);
          resolve();
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        const redirectUrl = response.headers.location;
        https.get(redirectUrl, (redirectResponse) => {
          if (redirectResponse.statusCode === 200) {
            redirectResponse.pipe(file);
            file.on('finish', () => {
              file.close();
              console.log(`✅ Downloaded ${fileInfo.name} (redirected)`);
              resolve();
            });
          } else {
            reject(new Error(`Failed to download ${fileInfo.name}: HTTP ${redirectResponse.statusCode}`));
          }
        }).on('error', reject);
      } else {
        reject(new Error(`Failed to download ${fileInfo.name}: HTTP ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

// Alternative CDN URLs if GitHub fails
const CDN_ALTERNATIVES = [
  'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model',
  'https://unpkg.com/@vladmandic/face-api@latest/model'
];

async function downloadFromCDN(cdnUrl) {
  console.log(`\n🔄 Trying CDN: ${cdnUrl}`);

  const cdnFiles = [
    'tiny-face-detector.json',
    'tiny-face-detector_weights.bin',
    'face-landmark-68.json',
    'face-landmark-68_weights.bin',
    'face-expression.json',
    'face-expression_weights.bin'
  ];

  for (const file of cdnFiles) {
    try {
      const fileInfo = {
        name: file,
        url: `${cdnUrl}/${file}`
      };
      await downloadFile(fileInfo);
    } catch (error) {
      console.warn(`⚠️  Failed to download ${file} from CDN:`, error.message);
    }
  }
}

// Main download function
async function downloadModels() {
  console.log('🚀 Starting face-api.js model download...\n');

  let successCount = 0;

  // Try downloading from GitHub first
  for (const fileInfo of MODEL_FILES) {
    try {
      await downloadFile(fileInfo);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to download ${fileInfo.name}:`, error.message);
    }
  }

  // If most files failed, try CDN alternatives
  if (successCount < MODEL_FILES.length / 2) {
    console.log('\n⚠️  Many downloads failed from GitHub, trying CDN alternatives...');

    for (const cdnUrl of CDN_ALTERNATIVES) {
      try {
        await downloadFromCDN(cdnUrl);
        break;
      } catch (error) {
        console.warn(`Failed to download from ${cdnUrl}:`, error.message);
      }
    }
  }

  // Check final status
  const downloadedFiles = fs.readdirSync(MODELS_DIR);
  console.log(`\n📊 Downloaded ${downloadedFiles.length} model files:`);
  downloadedFiles.forEach(file => console.log(`   - ${file}`));

  if (downloadedFiles.length === 0) {
    console.error('\n❌ No model files were downloaded successfully!');
    console.error('You may need to manually download the model files from:');
    console.error('https://github.com/justadudewhohacks/face-api.js/tree/master/weights');
    process.exit(1);
  } else {
    console.log('\n✅ Model download completed!');
    console.log('Face detection should now work properly.');
  }
}

// Run if executed directly
if (require.main === module) {
  downloadModels().catch(console.error);
}

module.exports = { downloadModels };
