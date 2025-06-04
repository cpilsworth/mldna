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
            <a href="https://experience.adobe.com/#/@adobeemea78/assets/contenthub/assets/urn:aaid:aem:f91bd1e9-b7da-4071-99a1-c73eee2e16f4" target="_blank">
                <img src="${base}/${result.assetId}/as/image.png?width=500" alt="${result.assetMetadata['dc:title'] || result.assetMetadata['autogen:title']}"/>
            </a>
        </div>

        <div class="result-item-info">
        <span class="result-item-format"> <${Format} format=${result.repositoryMetadata['dc:format']}/></span>
        <span class="result-item-name"> ${result.repositoryMetadata['repo:name']}</span><br/>
        <span class="result-item-size"> Size: ${result.repositoryMetadata['repo:size']}</span>
        </div>
    </div>`;
}

function Filter(props) {
    const { results, filter } = props;
    console.log(filter);
    return html`<div class="filter">
        <p>${results?.search_metadata?.count || 0} results found</p>
        <form>        
        <input type="text" name="keywords" value="${filter?.keywords?.join(',')}" placeholder="Keywords"/><br/>
        <input type="text" name="images" value="" placeholder="Search by image" disabled/><br/>
        <select id="cars" disabled >
           <option value="c1">Category 1</option>
           <option value="c2">Category 2</option>
           <option value="c3" selected>Category 3</option>
           <option value="all" selected>All Categories</option>
        </select><br/>
        <input type="text" name="images" value="" placeholder="Search by image" disabled/><br/>
        <input type="text" name="images" value="" placeholder="Search by image" disabled/><br/>
        <input type="text" name="images" value="" placeholder="Search by image" disabled/><br/>

        <button type="submit">Filter</button>
        </form>
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
            <${Filter} results=${results} filter="${criteria}"/>
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
        criteriaQuery.push({
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
