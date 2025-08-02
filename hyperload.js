#!/usr/bin/env node

const https = require('https');
const http = require('http');
const { URL } = require('url');
const { performance } = require('perf_hooks');
const readline = require('readline');
const os = require('os');

// Enhanced ANSI Colors with background support
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m'
};

class LoadTester {
    constructor(url, vus, duration, requestsPerVu = 100, method = 'GET', headers = {}) {
        this.url = url;
        this.vus = vus;
        this.duration = duration * 1000;
        this.requestsPerVu = requestsPerVu;
        this.method = method;
        this.customHeaders = headers;
        this.totalRequests = 0;
        this.successfulRequests = 0;
        this.failedRequests = 0;
        this.responseTimes = [];
        this.statusCodes = {};
        this.startTime = 0;
        this.endTime = 0;
        this.isRunning = false;
        this.cpuCores = os.cpus().length;
        
        this.parsedUrl = new URL(url);
        this.isHttps = this.parsedUrl.protocol === 'https:';
        this.httpModule = this.isHttps ? https : http;
    }

    printHeader() {
        console.clear();
        console.log(colors.bgBlue + colors.white + colors.bright + 
            '╔══════════════════════════════════════════════════════════════════════════════╗');
        console.log('║' + ' '.repeat(70) + '║');
        console.log('║' + colors.cyan + '                  🚀 HYPERLOAD PRO - ADVANCED LOAD TESTER 🚀               ' + colors.reset + colors.bgBlue + '║');
        console.log('║' + ' '.repeat(70) + '║');
        console.log('╚══════════════════════════════════════════════════════════════════════════════╝' + colors.reset);
        console.log();
        
        // System info
        console.log(colors.cyan + colors.bright + '⚙️  System Configuration:' + colors.reset);
        console.log(`  ${colors.blue}${colors.bright}CPU Cores:${colors.reset}      ${colors.yellow}${this.cpuCores}${colors.reset}`);
        console.log(`  ${colors.blue}${colors.bright}Node Version:${colors.reset}  ${colors.yellow}${process.versions.node}${colors.reset}`);
        console.log(`  ${colors.blue}${colors.bright}Platform:${colors.reset}      ${colors.yellow}${process.platform} ${process.arch}${colors.reset}`);
        console.log();
        
        // Test info
        console.log(colors.cyan + colors.bright + '📊 Test Configuration:' + colors.reset);
        console.log(`  ${colors.blue}${colors.bright}Target URL:${colors.reset}     ${this.url}`);
        console.log(`  ${colors.blue}${colors.bright}Method:${colors.reset}        ${colors.yellow}${this.method}${colors.reset}`);
        console.log(`  ${colors.blue}${colors.bright}Virtual Users:${colors.reset} ${colors.yellow}${this.vus.toLocaleString()}${colors.reset}`);
        console.log(`  ${colors.blue}${colors.bright}Duration:${colors.reset}      ${colors.yellow}${this.duration / 1000}s${colors.reset}`);
        console.log(`  ${colors.blue}${colors.bright}Requests/VU:${colors.reset}   ${colors.yellow}${this.requestsPerVu}${colors.reset}`);
        console.log(`  ${colors.blue}${colors.bright}Total Requests:${colors.reset}${colors.yellow} ${(this.vus * this.requestsPerVu).toLocaleString()}${colors.reset}`);
        
        // Show custom headers
        if (Object.keys(this.customHeaders).length > 0) {
            console.log(`  ${colors.blue}${colors.bright}Custom Headers:${colors.reset}`);
            for (const [key, value] of Object.entries(this.customHeaders)) {
                console.log(`    ${colors.yellow}${key}:${colors.reset} ${value}`);
            }
        }
        
        console.log();
    }

    createProgressBar(percentage, width = 40) {
        const filled = Math.round((percentage / 100) * width);
        const empty = width - filled;
        
        return colors.bgGreen + ' '.repeat(filled) + 
               colors.bgYellow + ' '.repeat(empty) + 
               colors.reset;
    }

    updateDashboard() {
        if (!this.isRunning) return;
        
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(100, (elapsed / this.duration) * 100);
        const rps = elapsed > 0 ? (this.totalRequests / (elapsed / 1000)).toFixed(1) : 0;
        const successRate = this.totalRequests > 0 ? 
            ((this.successfulRequests / this.totalRequests) * 100).toFixed(1) : 0;
        
        // Calculate response time stats
        let avgResponseTime = 0;
        let minResponseTime = 0;
        let maxResponseTime = 0;
        
        if (this.responseTimes.length > 0) {
            avgResponseTime = this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
            minResponseTime = Math.min(...this.responseTimes);
            maxResponseTime = Math.max(...this.responseTimes);
        }
        
        // Build dashboard
        readline.cursorTo(process.stdout, 0, 15);
        readline.clearScreenDown(process.stdout);
        
        console.log(colors.cyan + colors.bright + '  LIVE DASHBOARD' + colors.reset);
        console.log(colors.blue + '  ' + '─'.repeat(70) + colors.reset);
        
        // Progress bar
        console.log(`  ${colors.bright}Progress:${colors.reset}`);
        console.log(`  ${this.createProgressBar(progress)} ${colors.yellow}${progress.toFixed(1)}%${colors.reset}`);
        console.log();
        
        // Stats row 1
        console.log(`  ${colors.bright}${colors.blue}Duration:${colors.reset} ${colors.yellow}${(elapsed/1000).toFixed(1)}s${colors.reset} / ${colors.yellow}${this.duration/1000}s${colors.reset} | ` +
                   `${colors.blue}Remaining:${colors.reset} ${colors.yellow}${((this.duration - elapsed)/1000).toFixed(1)}s${colors.reset} | ` +
                   `${colors.blue}RPS:${colors.reset} ${colors.yellow}${rps}${colors.reset}`);
        
        // Stats row 2
        console.log(`  ${colors.bright}${colors.blue}Requests:${colors.reset} ${colors.yellow}${this.totalRequests.toLocaleString()}${colors.reset} | ` +
                   `${colors.blue}Success:${colors.reset} ${colors.green}${this.successfulRequests.toLocaleString()}${colors.reset} | ` +
                   `${colors.blue}Failed:${colors.reset} ${colors.red}${this.failedRequests.toLocaleString()}${colors.reset} | ` +
                   `${colors.blue}Success Rate:${colors.reset} ${successRate >= 90 ? colors.green : colors.red}${successRate}%${colors.reset}`);
        
        // Stats row 3
        console.log(`  ${colors.bright}${colors.blue}Response Times (ms):${colors.reset} ` +
                   `${colors.blue}Min:${colors.reset} ${colors.green}${minResponseTime.toFixed(2)}${colors.reset} | ` +
                   `${colors.blue}Avg:${colors.reset} ${colors.yellow}${avgResponseTime.toFixed(2)}${colors.reset} | ` +
                   `${colors.blue}Max:${colors.reset} ${colors.red}${maxResponseTime.toFixed(2)}${colors.reset}`);
        
        // Status codes
        if (Object.keys(this.statusCodes).length > 0) {
            console.log(`  ${colors.bright}${colors.blue}Status Codes:${colors.reset}`);
            const codes = Object.entries(this.statusCodes)
                .sort((a, b) => b[1] - a[1])
                .map(([code, count]) => {
                    const color = code.startsWith('2') ? colors.green : 
                                 code.startsWith('4') ? colors.yellow : colors.red;
                    return `${color}${code}: ${count}${colors.reset}`;
                })
                .join(' | ');
            console.log('  ' + codes);
        }
        
        console.log(colors.blue + '  ' + '─'.repeat(70) + colors.reset);
        console.log(`${colors.dim}  Press ${colors.bright}CTRL+C${colors.reset}${colors.dim} to stop test${colors.reset}`);
        
        // Move cursor back up
        readline.cursorTo(process.stdout, 0, 15);
    }

    makeRequest() {
        return new Promise((resolve) => {
            const startTime = performance.now();
            
            const options = {
                hostname: this.parsedUrl.hostname,
                port: this.parsedUrl.port || (this.isHttps ? 443 : 80),
                path: this.parsedUrl.pathname + this.parsedUrl.search,
                method: this.method,
                timeout: 10000,
                headers: {
                    'User-Agent': 'HyperLoadPro/2.0',
                    ...this.customHeaders
                }
            };

            const req = this.httpModule.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    const endTime = performance.now();
                    const responseTime = endTime - startTime;
                    
                    // Update status code tracking
                    const statusCode = res.statusCode.toString();
                    this.statusCodes[statusCode] = (this.statusCodes[statusCode] || 0) + 1;
                    
                    this.totalRequests++;
                    this.responseTimes.push(responseTime);
                    
                    if (res.statusCode >= 200 && res.statusCode < 400) {
                        this.successfulRequests++;
                    } else {
                        this.failedRequests++;
                    }
                    
                    resolve();
                });
            });

            req.on('error', (e) => {
                this.totalRequests++;
                this.failedRequests++;
                this.statusCodes['ERR'] = (this.statusCodes['ERR'] || 0) + 1;
                resolve();
            });

            req.on('timeout', () => {
                req.destroy();
                this.totalRequests++;
                this.failedRequests++;
                this.statusCodes['TIMEOUT'] = (this.statusCodes['TIMEOUT'] || 0) + 1;
                resolve();
            });

            req.end();
        });
    }

    async runVirtualUser() {
        const requests = [];
        const start = Date.now();
        
        while (this.isRunning && (Date.now() - start) < this.duration) {
            requests.push(this.makeRequest());
            
            // Use smarter adaptive throttling
            const currentRPS = requests.length / ((Date.now() - start) / 1000);
            if (currentRPS > 100) {
                await new Promise(r => setTimeout(r, 10));
            }
        }
        
        await Promise.all(requests);
    }

    calculateStats() {
        if (this.responseTimes.length === 0) return null;
        
        const sorted = [...this.responseTimes].sort((a, b) => a - b);
        const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const p50 = sorted[Math.floor(sorted.length * 0.5)];
        const p90 = sorted[Math.floor(sorted.length * 0.90)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        const p99 = sorted[Math.floor(sorted.length * 0.99)];
        
        return { avg, min, max, p50, p90, p95, p99 };
    }

    printResults() {
        console.log('\n\n' + colors.bgBlue + colors.white + colors.bright + 
            '╔══════════════════════════════════════════════════════════════════════════════╗');
        console.log('║' + ' '.repeat(70) + '║');
        console.log('║' + colors.cyan + '                       📊 TEST RESULTS SUMMARY 📊                      ' + colors.reset + colors.bgBlue + '║');
        console.log('║' + ' '.repeat(70) + '║');
        console.log('╚══════════════════════════════════════════════════════════════════════════════╝' + colors.reset);
        console.log();
        
        const duration = (this.endTime - this.startTime) / 1000;
        const rps = (this.totalRequests / duration).toFixed(1);
        const successRate = this.totalRequests > 0 ? 
            ((this.successfulRequests / this.totalRequests) * 100).toFixed(2) : 0;
        
        // Summary Table
        console.log(colors.cyan + colors.bright + '📈 Performance Summary:' + colors.reset);
        console.log(colors.blue + '┌' + '─'.repeat(28) + '┬' + '─'.repeat(39) + '┐' + colors.reset);
        console.log(`${colors.blue}│ ${colors.bright}${colors.white}Metric${colors.reset}${' '.repeat(21)}${colors.blue}│ ${colors.bright}${colors.white}Value${colors.reset}${' '.repeat(33)}${colors.blue}│`);
        console.log(colors.blue + '├' + '─'.repeat(28) + '┼' + '─'.repeat(39) + '┤' + colors.reset);
        
        console.log(`${colors.blue}│ ${colors.cyan}Total Requests${colors.reset}${' '.repeat(13)}${colors.blue}│ ${colors.yellow}${this.totalRequests.toLocaleString().padEnd(37)}${colors.blue}│`);
        console.log(`${colors.blue}│ ${colors.cyan}Successful Requests${colors.reset}${' '.repeat(8)}${colors.blue}│ ${colors.green}${this.successfulRequests.toLocaleString().padEnd(37)}${colors.blue}│`);
        console.log(`${colors.blue}│ ${colors.cyan}Failed Requests${colors.reset}${' '.repeat(12)}${colors.blue}│ ${colors.red}${this.failedRequests.toLocaleString().padEnd(37)}${colors.blue}│`);
        console.log(`${colors.blue}│ ${colors.cyan}Success Rate${colors.reset}${' '.repeat(15)}${colors.blue}│ ${successRate >= 90 ? colors.green : colors.red}${successRate}%${' '.repeat(36 - successRate.length)}${colors.blue}│`);
        console.log(`${colors.blue}│ ${colors.cyan}Test Duration${colors.reset}${' '.repeat(14)}${colors.blue}│ ${colors.yellow}${duration.toFixed(2)}s${' '.repeat(35)}${colors.blue}│`);
        console.log(`${colors.blue}│ ${colors.cyan}Requests/sec${colors.reset}${' '.repeat(15)}${colors.blue}│ ${colors.yellow}${rps}${' '.repeat(37 - rps.length)}${colors.blue}│`);
        console.log(colors.blue + '└' + '─'.repeat(28) + '┴' + '─'.repeat(39) + '┘' + colors.reset);
        console.log();
        
        // Response Times
        const stats = this.calculateStats();
        if (stats) {
            console.log(colors.cyan + colors.bright + '⏱️  Response Time Statistics (ms):' + colors.reset);
            console.log(colors.blue + '┌' + '─'.repeat(20) + '┬' + '─'.repeat(15) + '┐' + colors.reset);
            console.log(`${colors.blue}│ ${colors.bright}${colors.white}Percentile${colors.reset}${' '.repeat(8)}${colors.blue}│ ${colors.bright}${colors.white}Time${colors.reset}${' '.repeat(10)}${colors.blue}│`);
            console.log(colors.blue + '├' + '─'.repeat(20) + '┼' + '─'.repeat(15) + '┤' + colors.reset);
            
            console.log(`${colors.blue}│ ${colors.cyan}Average${colors.reset}${' '.repeat(12)}${colors.blue}│ ${colors.yellow}${stats.avg.toFixed(2).padStart(10)}${' '.repeat(4)}${colors.blue}│`);
            console.log(`${colors.blue}│ ${colors.cyan}Minimum${colors.reset}${' '.repeat(12)}${colors.blue}│ ${colors.green}${stats.min.toFixed(2).padStart(10)}${' '.repeat(4)}${colors.blue}│`);
            console.log(`${colors.blue}│ ${colors.cyan}Maximum${colors.reset}${' '.repeat(12)}${colors.blue}│ ${colors.red}${stats.max.toFixed(2).padStart(10)}${' '.repeat(4)}${colors.blue}│`);
            console.log(`${colors.blue}│ ${colors.cyan}50th percentile${colors.reset}${' '.repeat(4)}${colors.blue}│ ${colors.yellow}${stats.p50.toFixed(2).padStart(10)}${' '.repeat(4)}${colors.blue}│`);
            console.log(`${colors.blue}│ ${colors.cyan}90th percentile${colors.reset}${' '.repeat(4)}${colors.blue}│ ${colors.yellow}${stats.p90.toFixed(2).padStart(10)}${' '.repeat(4)}${colors.blue}│`);
            console.log(`${colors.blue}│ ${colors.cyan}95th percentile${colors.reset}${' '.repeat(4)}${colors.blue}│ ${colors.yellow}${stats.p95.toFixed(2).padStart(10)}${' '.repeat(4)}${colors.blue}│`);
            console.log(`${colors.blue}│ ${colors.cyan}99th percentile${colors.reset}${' '.repeat(4)}${colors.blue}│ ${colors.yellow}${stats.p99.toFixed(2).padStart(10)}${' '.repeat(4)}${colors.blue}│`);
            console.log(colors.blue + '└' + '─'.repeat(20) + '┴' + '─'.repeat(15) + '┘' + colors.reset);
            console.log();
        }
        
        // Status Code Distribution
        if (Object.keys(this.statusCodes).length > 0) {
            console.log(colors.cyan + colors.bright + '📋 HTTP Status Code Distribution:' + colors.reset);
            const totalCodes = Object.values(this.statusCodes).reduce((a, b) => a + b, 0);
            
            const codeEntries = Object.entries(this.statusCodes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10); // Show top 10
            
            console.log(colors.blue + '┌' + '─'.repeat(10) + '┬' + '─'.repeat(15) + '┬' + '─'.repeat(20) + '┐' + colors.reset);
            console.log(`${colors.blue}│ ${colors.bright}${colors.white}Code${colors.reset}${' '.repeat(5)}${colors.blue}│ ${colors.bright}${colors.white}Count${colors.reset}${' '.repeat(9)}${colors.blue}│ ${colors.bright}${colors.white}Percentage${colors.reset}${' '.repeat(9)}${colors.blue}│`);
            console.log(colors.blue + '├' + '─'.repeat(10) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(20) + '┤' + colors.reset);
            
            for (const [code, count] of codeEntries) {
                const percentage = ((count / totalCodes) * 100).toFixed(1);
                const color = code.startsWith('2') ? colors.green : 
                             code.startsWith('3') ? colors.cyan : 
                             code.startsWith('4') ? colors.yellow : colors.red;
                
                console.log(
                    `${colors.blue}│ ${color}${code.padEnd(8)}${colors.blue}│ ` +
                    `${color}${count.toString().padEnd(13)}${colors.blue}│ ` +
                    `${color}${percentage}%${' '.repeat(17 - percentage.length)}${colors.blue}│`
                );
            }
            
            console.log(colors.blue + '└' + '─'.repeat(10) + '┴' + '─'.repeat(15) + '┴' + '─'.repeat(20) + '┘' + colors.reset);
        }
        
        console.log('\n' + colors.bgGreen + colors.bright + colors.white + 
            '✅ LOAD TEST COMPLETED SUCCESSFULLY!' + colors.reset + '\n');
    }

    async run() {
        this.printHeader();
        
        console.log(colors.yellow + '⚡ Initializing test environment...' + colors.reset);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log(colors.green + '🚀 Starting load test with ' + 
                   colors.yellow + this.vus.toLocaleString() + 
                   colors.green + ' virtual users...' + colors.reset);
        
        // Prepare dashboard space
        for (let i = 0; i < 8; i++) console.log();
        
        this.isRunning = true;
        this.startTime = Date.now();
        
        // Start dashboard updates
        const dashboardInterval = setInterval(() => {
            this.updateDashboard();
        }, 500);
        
        // Create virtual users
        const virtualUsers = [];
        for (let i = 0; i < this.vus; i++) {
            virtualUsers.push(this.runVirtualUser());
        }
        
        // Set timeout to stop after duration
        const timeout = setTimeout(() => {
            this.isRunning = false;
        }, this.duration);
        
        // Wait for all VUs to complete or timeout
        await Promise.race([
            Promise.all(virtualUsers),
            new Promise(resolve => setTimeout(resolve, this.duration + 2000))
        ]);
        
        this.isRunning = false;
        this.endTime = Date.now();
        
        clearInterval(dashboardInterval);
        clearTimeout(timeout);
        
        // Final dashboard update
        this.updateDashboard();
        
        // Show results
        this.printResults();
    }
}

// Enhanced CLI Interface
function printUsage() {
    console.log(colors.bgBlue + colors.white + colors.bright + 
        '╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║' + ' '.repeat(70) + '║');
    console.log('║' + colors.cyan + '                     🚀 HYPERLOAD PRO - LOAD TESTER CLI 🚀                   ' + colors.reset + colors.bgBlue + '║');
    console.log('║' + ' '.repeat(70) + '║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝' + colors.reset);
    console.log();
    
    console.log(colors.white + 'Usage:' + colors.reset);
    console.log('  hyperload --url <URL> --vus <NUMBER> --duration <SECONDS> [OPTIONS]');
    console.log();
    
    console.log(colors.white + 'Required Parameters:' + colors.reset);
    console.log(`  ${colors.blue}${colors.bright}--url${colors.reset}            Target URL to test (include protocol)`);
    console.log(`  ${colors.blue}${colors.bright}--vus${colors.reset}            Number of Virtual Users (1-${Number.MAX_SAFE_INTEGER.toLocaleString()})`);
    console.log(`  ${colors.blue}${colors.bright}--duration${colors.reset}       Test duration in seconds`);
    console.log();
    
    console.log(colors.white + 'Advanced Parameters:' + colors.reset);
    console.log(`  ${colors.blue}${colors.bright}--requests${colors.reset}       Requests per Virtual User (default: 100)`);
    console.log(`  ${colors.blue}${colors.bright}--method${colors.reset}         HTTP Method (default: GET)`);
    console.log(`  ${colors.blue}${colors.bright}--header${colors.reset}         Add custom header (format: "Key: Value")`);
    console.log(`  ${colors.blue}${colors.bright}--help${colors.reset}           Show this help message`);
    console.log(`  ${colors.blue}${colors.bright}--version${colors.reset}        Show version information`);
    console.log();
    
    console.log(colors.white + 'Examples:' + colors.reset);
    console.log(`  ${colors.gray}hyperload --url https://example.com --vus 1000 --duration 60${colors.reset}`);
    console.log(`  ${colors.gray}hyperload --url https://api.example.com --vus 500 --duration 30 --requests 50${colors.reset}`);
    console.log(`  ${colors.gray}hyperload --url http://localhost:3000 --vus 100 --duration 10 --method POST${colors.reset}`);
    console.log(`  ${colors.gray}hyperload --url https://api.example.com --vus 200 --duration 20 --header "Authorization: Bearer token"${colors.reset}`);
    console.log();
    
    console.log(colors.white + 'Performance Tips:' + colors.reset);
    console.log(`  • Use ${colors.yellow}CTRL+C${colors.reset} to stop test early and see partial results`);
    console.log(`  • For high-load tests, run on a machine with good network connectivity`);
    console.log(`  • Monitor your target server resources during testing`);
    console.log();
}

function parseArguments(args) {
    const params = {
        headers: {}
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--url':
                params.url = args[++i];
                break;
            case '--vus':
                params.vus = parseInt(args[++i]);
                break;
            case '--duration':
                params.duration = parseInt(args[++i]);
                break;
            case '--requests':
                params.requests = parseInt(args[++i]);
                break;
            case '--method':
                params.method = args[++i].toUpperCase();
                break;
            case '--header':
                const header = args[++i].split(':');
                if (header.length >= 2) {
                    const key = header[0].trim();
                    const value = header.slice(1).join(':').trim();
                    params.headers[key] = value;
                }
                break;
            case '--help':
            case '-h':
                params.help = true;
                break;
            case '--version':
            case '-v':
                params.version = true;
                break;
            default:
                if (arg.startsWith('--')) {
                    console.error(colors.red + `❌ Unknown parameter: ${arg}${colors.reset}`);
                    process.exit(1);
                }
        }
    }
    
    return params;
}

async function main() {
    const args = process.argv.slice(2);
    const params = parseArguments(args);
    
    if (params.help) {
        printUsage();
        process.exit(0);
    }
    
    if (params.version) {
        console.log(colors.cyan + 'HyperLoad Pro CLI v2.0' + colors.reset);
        console.log(colors.dim + 'Advanced load testing solution for performance engineers' + colors.reset);
        process.exit(0);
    }
    
    if (!params.url || !params.vus || !params.duration) {
        console.error(colors.red + '❌ Error: Missing required parameters' + colors.reset);
        console.log();
        printUsage();
        process.exit(1);
    }
    
    // Validate arguments
    if (!params.url.startsWith('http://') && !params.url.startsWith('https://')) {
        console.error(colors.red + ' Error: URL must start with http:// or https://' + colors.reset);
        process.exit(1);
    }
    
    if (isNaN(params.vus) || params.vus <= 0) {
        console.error(colors.red + ' Error: VUs must be a positive number' + colors.reset);
        process.exit(1);
    }
    
    if (isNaN(params.duration) || params.duration <= 0) {
        console.error(colors.red + ' Error: Duration must be a positive number' + colors.reset);
        process.exit(1);
    }
    
    const requests = params.requests || 100;
    if (isNaN(requests) || requests <= 0) {
        console.error(colors.red + ' Error: Requests per VU must be a positive number' + colors.reset);
        process.exit(1);
    }
    
    const method = params.method || 'GET';
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'];
    if (!validMethods.includes(method)) {
        console.error(colors.red + ` Error: Invalid HTTP method. Valid methods are: ${validMethods.join(', ')}` + colors.reset);
        process.exit(1);
    }
    
    // Create tester
    const tester = new LoadTester(
        params.url, 
        params.vus, 
        params.duration, 
        requests,
        method,
        params.headers
    );
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n' + colors.yellow + ' Test interrupted by user' + colors.reset);
        tester.isRunning = false;
        setTimeout(() => {
            tester.printResults();
            process.exit(0);
        }, 1000);
    });
    
    try {
        await tester.run();
    } catch (error) {
        console.error(colors.red + ' Critical error running load test:' + colors.reset, error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}
