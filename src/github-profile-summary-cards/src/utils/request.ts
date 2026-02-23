// import core from '@actions/core';
export default async function request(header: any, data: any): Promise<any> {
    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            ...header,
            'Content-Type': 'application/json',
            'User-Agent': 'github-profile-summary-cards-worker',
        },
        body: JSON.stringify(data),
    });

    const result = await response.json();
    return { data: result };
}
