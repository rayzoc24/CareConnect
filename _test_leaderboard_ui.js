// Quick test to verify leaderboard JSON response structure
const http = require('http');

function test(path) {
    return new Promise((resolve) => {
        http.get(`http://localhost:3000${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`✓ ${path}`);
                    console.log(`  Status: ${res.statusCode}, Entries: ${json.length}`);
                    if (json.length > 0) {
                        console.log(`  Sample: ${json[0].name} (rank #${json[0].rank}, ${json[0].totalScore} pts)`);
                    }
                } catch (e) {
                    console.log(`✗ ${path} - ${e.message}`);
                }
                resolve();
            });
        }).on('error', err => {
            console.log(`✗ ${path} - ${err.message}`);
            resolve();
        });
    });
}

async function runTests() {
    console.log('\n🧪 Leaderboard API Tests:\n');
    await test('/api/leaderboard/volunteers?range=weekly');
    await test('/api/leaderboard/volunteers?range=monthly');
    await test('/api/leaderboard/ngos?range=weekly');
    await test('/api/leaderboard/ngos?range=monthly');
    console.log('\n✅ Leaderboard assets created:\n');
    console.log('  📄 leaderboard.html - Main leaderboard page');
    console.log('  🎨 leaderboard-styles.css - Modern card-based design');
    console.log('  ⚙️  leaderboard.js - Component logic & API integration');
    console.log('\n🌐 Access at: http://localhost:3000/leaderboard.html\n');
}

runTests();
