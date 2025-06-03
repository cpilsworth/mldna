  import {
    readBlockConfig
  } from '../../scripts/aem.js';

  
export default async function decorate(block) {
    const config = readBlockConfig(block);
    block.innerHTML = '';
    console.log(config);
    let results = await search(config);
    console.log(results);

    const resultsContainer = document.createElement('div');
    resultsContainer.classList.add('results');
    block.append(resultsContainer);
}

async function search(config) {
    const query = {
        "query": [
          {
            "term": {
                "metadata.assetMetadata.dam:assetStatus": ["approved"]
            } 
          }
        ],
        "orderBy": "metadata.repositoryMetadata.repo:createDate desc",
        "limit": 50
    };
    const url = `${config.base}/search`;
    const results = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(query),
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Api-Key': 'asset_search_service',
            'Authorization': `Bearer ${config.token}`
        }
    });
    return results.json(); 
}
  