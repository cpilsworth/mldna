  import {
    readBlockConfig
  } from '../../scripts/aem.js';

  
export default async function decorate(block) {
    const config = readBlockConfig(block);

    console.log(config);
  }
  