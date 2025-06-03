import {
    readBlockConfig
} from '../../scripts/aem.js';

/** REACT FRONTEND */

import { html, render } from 'https://esm.sh/htm/preact/standalone'

function Format(props) {
    const { format } = props;
    const label = format.split('/')[1];
    return html`<span class="result-item-${label}">${label}</p>`;
}

function Result(props) {
    const { result, base } = props;
    return html`<div class="result-item">
        <div class="result-item-image">
            <a href="https://experience.adobe.com/#/@adobeemea78/assets/contenthub/assets/urn:aaid:aem:e206c59c-188e-4ff9-9e33-5795c4e1913d" target="_blank">
                <img src="${base}/${result.assetId}/as/image.png?width=500" alt="${result.assetMetadata['dc:title'] || result.assetMetadata['autogen:title']}"/>
            </a>
        </div>
        <p class="result-item-info">${result.repositoryMetadata['repo:name']}<br/>
        <${Format} format=${result.repositoryMetadata['dc:format']}/>, Size: ${result.repositoryMetadata['repo:size']}</p>
    </div>`;
}

function Filter(props) {
    const { results, filter } = props;
    return html`<div class="filter">
        <p>${results?.search_metadata?.count || 0} results found</p>
        <p>${filter}</p>
    </div>`;
}

function Results(props) {
    const { results, config, criteria } = props;
    console.log(results);
    return html`
        <div class="results-container">
            <div class="results-list">
                ${results?.hits?.results?.map(result => html`<${Result} result=${result} base=${config.base}/>`)}
            </div>
            <${Filter} results=${results} filter="${JSON.stringify(criteria)}"/>
        </div>
    `;
}


/** SEARCH PREP */

function criteriaToQuery(criteria) {
    let criteriaQuery = [];

    if (criteria.keywords) {
        for (const keyword of criteria.keywords) {
            criteriaQuery.push({
                "term": {
                    "metadata.assetMetadata.dc:subject": [ keyword ]
                }
            });
        }

    } else {
        Object.assign(criteriaQuery, {
            "term": {
                "metadata.assetMetadata.dam:assetStatus": [ "approved"]
            }
        });
    }

    console.log(JSON.stringify(criteriaQuery));
    const query = {
        "query": [{
            "and": criteriaQuery
        }],
        "orderBy": "metadata.repositoryMetadata.repo:createDate desc",
        "limit": 50
    };
    return query;
}

async function search(config, criteria) {
    const query = criteriaToQuery(criteria);
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

/** EDS BLOCK */


export default async function decorate(block) {
    const config = readBlockConfig(block);
    block.innerHTML = '';

    const searchParams = new URLSearchParams(document.location.search);
    const keywords = searchParams.get('keywords')?.trim().split(',');

    const criteria = {
        "keywords": keywords
    };

    let results = await search(config, criteria);

    const resultsContainer = document.createElement('div');
    resultsContainer.classList.add('results');
    block.append(resultsContainer);
    render(html`<${Results} results=${results} config=${config} criteria=${criteria}/>`, resultsContainer);
}
