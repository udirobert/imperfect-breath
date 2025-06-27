// This is a placeholder for the Lens Hub contract address
export const LENS_HUB_CONTRACT_ADDRESS = '0xDb46d1Dc155634FbC732f92E853b10B2897443aa'; // Example on Polygon

// This is a placeholder for the actual Lens Protocol ABI
// In a real scenario, you would use the Lens SDK or a more specific ABI
export const LENS_HUB_ABI = [
  // getProfile
  {
    "constant": true,
    "inputs": [{ "name": "profileId", "type": "uint256" }],
    "name": "getProfile",
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "pubCount", "type": "uint256" },
          { "name": "followModule", "type": "address" },
          { "name": "followNFT", "type": "address" },
          { "name": "handle", "type": "string" },
          { "name": "imageURI", "type": "string" },
          { "name": "followNFTURI", "type": "string" }
        ]
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // defaultProfile
  {
    "constant": true,
    "inputs": [{ "name": "owner", "type": "address" }],
    "name": "defaultProfile",
    "outputs": [{ "name": "", "type": "uint256" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // getPub
  {
    "constant": true,
    "inputs": [
      { "name": "profileId", "type": "uint256" },
      { "name": "pubId", "type": "uint256" }
    ],
    "name": "getPub",
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "profileIdPointed", "type": "uint256" },
          { "name": "pubIdPointed", "type": "uint256" },
          { "name": "contentURI", "type": "string" },
          { "name": "referenceModule", "type": "address" },
          { "name": "collectModule", "type": "address" },
          { "name": "collectNFT", "type": "address" }
        ]
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // follow
  {
    "constant": false,
    "inputs": [
      { "name": "profileIds", "type": "uint256[]" },
      { "name": "datas", "type": "bytes[]" }
    ],
    "name": "follow",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // getFollows
  {
    "constant": true,
    "inputs": [{ "name": "profileId", "type": "uint256" }],
    "name": "getFollows",
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // mirror
  {
    "constant": false,
    "inputs": [
      {
        "type": "tuple",
        "name": "vars",
        "components": [
          { "type": "uint256", "name": "profileId" },
          { "type": "uint256", "name": "profileIdPointed" },
          { "type": "uint256", "name": "pubIdPointed" },
          { "type": "bytes", "name": "referenceModuleData" },
          { "type": "address", "name": "referenceModule" },
          { "type": "address", "name": "referenceModuleInit" }
        ]
      }
    ],
    "name": "mirror",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // collect
  {
    "constant": false,
    "inputs": [
      {
        "type": "tuple",
        "name": "vars",
        "components": [
          { "type": "uint256", "name": "profileId" },
          { "type": "uint256", "name": "pubId" },
          { "type": "bytes", "name": "data" }
        ]
      }
    ],
    "name": "collect",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // getFollowersCount
  {
    "constant": true,
    "inputs": [{ "name": "profileId", "type": "uint256" }],
    "name": "getFollowersCount",
    "outputs": [{ "name": "", "type": "uint256" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // getFollowingCount
  {
    "constant": true,
    "inputs": [{ "name": "profileId", "type": "uint256" }],
    "name": "getFollowingCount",
    "outputs": [{ "name": "", "type": "uint256" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // comment
  {
    "constant": false,
    "inputs": [
      {
        "type": "tuple",
        "name": "vars",
        "components": [
          { "type": "uint256", "name": "profileId" },
          { "type": "string", "name": "contentURI" },
          { "type": "uint256", "name": "profileIdPointed" },
          { "type": "uint256", "name": "pubIdPointed" },
          { "type": "bytes", "name": "referenceModuleData" },
          { "type": "address", "name": "collectModule" },
          { "type": "bytes", "name": "collectModuleInitData" },
          { "type": "address", "name": "referenceModule" },
          { "type": "bytes", "name": "referenceModuleInitData" }
        ]
      }
    ],
    "name": "comment",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // getComments
  {
    "constant": true,
    "inputs": [
      { "name": "profileId", "type": "uint256" },
      { "name": "pubId", "type": "uint256" }
    ],
    "name": "getComments",
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];