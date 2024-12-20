const headers = {
    'User-Agent': 'greys-record-collection/1.0 +https://mesagrey.ca/collection'
};

// Determine if running on .onion or clearnet
const isOnionService = window.location.hostname.endsWith('.onion');

// Use proxy endpoint if on .onion, otherwise use the direct API endpoint
const apiBaseUrl = isOnionService
    ? 'https://api.discogs.com' //localhost is "http://localhost:3000/api". CURRENTLY REMOVED AS IT'S BROKEN!
    : 'https://api.discogs.com';

const discogsToken = 'VWGTVobvMLNCXreSAAEtaQXRcZLTBrhBgcJvhdKJ'; 

let records = [];

async function fetchRecords(type) {
    const url = type === 'wantlist'
        ? `${apiBaseUrl}/users/greymesa_/wants`
        : `${apiBaseUrl}/users/greymesa_/collection/folders/0/releases`;

    const fetchOptions = {
        method: 'GET',
        headers: Object.assign({}, headers)
    };

    // Add the Discogs token header if on onion service
    if (isOnionService) {
        fetchOptions.headers['Discogs-Token'] = discogsToken;
    } else {
        fetchOptions.headers['Authorization'] = `Discogs token=${discogsToken}`;
    }

    try {
        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            throw new Error('Failed to fetch records');
        }

        const data = await response.json();
        records = type === 'wantlist' ? data.wants : data.releases;
        displayRecords();
    } catch (error) {
        console.error(error.message);
        if (isOnionService) {
    document.getElementById('records').innerHTML = '<p>Failed to load records. This might be due to NoScript blocking scripts. Please view on Clearnet or Disable NoScript for this site.</p>';
    } else {
    document.getElementById('records').innerHTML = '<p>Failed to load records.</p>';
    }
    }
}

async function getRecordURI(tag) {
    const url = `${apiBaseUrl}/releases/${tag}`;
    
    const fetchOptions = {
        method: 'GET',
        headers: Object.assign({}, headers)
    };

    // Add the Discogs token header if on onion service
    if (isOnionService) {
        fetchOptions.headers['Discogs-Token'] = discogsToken;
    } else {
        fetchOptions.headers['Authorization'] = `Discogs token=${discogsToken}`;
    }

    try {
        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            throw new Error('Failed to fetch record details');
        }

        const data = await response.json();
        return data.uri || '';
    } catch (error) {
        console.error(error.message);
        return '';
    }
}

async function handleRecordClick(tag) {
    const uri = await getRecordURI(tag);
    if (uri) {
        window.open(uri, '_blank');
    } else {
        console.error('No URI found for the record');
    }
}

function sortRecords(sortBy, sortOrder) {
    return records.sort((a, b) => {
        const getPrimaryValue = (record) => {
            switch (sortBy) {
                case 'date-added':
                    return new Date(record.date_added);
                case 'year':
                    return record.basic_information.year;
                case 'artist':
                    return record.basic_information.artists.map(artist => artist.name).join(', ');
                case 'title':
                    return record.basic_information.title;
                case 'genre':
                    return record.basic_information.genres.join(', ');
                default:
                    return '';
            }
        };

        const valueA = getPrimaryValue(a);
        const valueB = getPrimaryValue(b);

        if (sortOrder === 'asc') {
            return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        } else {
            return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
        }
    });
}

function displayRecords() {
    const searchQuery = document.getElementById('search-box').value.toLowerCase();
    const sortBy = document.getElementById('sort-by').value;
    const sortOrder = document.getElementById('sort-order').value;
    const sortedRecords = sortRecords(sortBy, sortOrder);

    const filteredRecords = sortedRecords.filter(record => {
        const title = record.basic_information.title.toLowerCase();
        const artist = record.basic_information.artists.map(artist => artist.name).join(', ').toLowerCase();
        const genre = record.basic_information.genres.join(', ').toLowerCase();

        return title.includes(searchQuery) || artist.includes(searchQuery) || genre.includes(searchQuery);
    });

    const recordsContainer = document.getElementById('records');
    recordsContainer.innerHTML = '';  // Clear previous records

    filteredRecords.forEach(record => {
        const recordElement = document.createElement('div');
        recordElement.className = 'record';
        const tag = record.id;

        const coverImage = record.basic_information.cover_image || '/assets/images/placeholder.png'; // Placeholder if no cover image
        const title = record.basic_information.title;
        const format = record.basic_information.formats.map(format => format.name).join(', ');
        const genre = record.basic_information.genres.join(', ');
        const artist = record.basic_information.artists.map(artist => artist.name).join(', ');
        const year = record.basic_information.year;
        const dateAdded = new Date(record.date_added).toLocaleDateString();

        recordElement.innerHTML = `
            <img src="${coverImage}" alt="${title} cover" style="cursor: pointer;">
            <div class="record-info">
                <h2>${title}</h2>
                <p>Artist: ${artist}</p>
                <p>Format: ${format}</p>
                <p>Genre: ${genre}</p>
                <p>Year: ${year}</p>
                <p>Date Added: ${dateAdded}</p>
            </div>
        `;

        recordElement.addEventListener('click', () => handleRecordClick(tag));
        recordsContainer.appendChild(recordElement);
    });
}

document.getElementById('record-type').addEventListener('change', (event) => {
    fetchRecords(event.target.value);
});

document.getElementById('sort-by').addEventListener('change', () => {
    displayRecords();
});

document.getElementById('sort-order').addEventListener('change', () => {
    displayRecords();
});

document.getElementById('search-box').addEventListener('input', () => {
    displayRecords();
});

// Fetch owned records by default on initial load
document.getElementById('sort-by').value = 'date-added';
document.getElementById('sort-order').value = 'desc';
fetchRecords('collection');
