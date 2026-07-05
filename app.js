// app.js
// Runs when the user clicks "Calculate My Chances"

// TODO v2: add a "Startup" score category too, dropped it for now
// because I couldn't figure out fair weights yet

function calculate() {

    // STEP 1: collect form data
    const tierRadio = document.querySelector('input[name="tier"]:checked');
    const tier = tierRadio ? tierRadio.value : '3';

    const cgpa     = parseFloat(document.getElementById('cgpa').value)  || 0;
    const leetcode = parseInt(document.getElementById('leetcode').value) || 0;
    const projects = parseInt(document.getElementById('projects').value) || 0;

    const skillCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    const skills = [];
    skillCheckboxes.forEach(function(checkbox) {
        skills.push(checkbox.value);
    });

    const targetRadio = document.querySelector('input[name="target"]:checked');
    const target = targetRadio ? targetRadio.value : 'fullstack';

    const profile = {
        tier: tier,
        cgpa: cgpa,
        leetcode: leetcode,
        projects: projects,
        skills: skills,
        target: target
    };

    const scores = calculateScores(profile);
    const gaps = generateGaps(scores, profile);
    const plan = generate30DayPlan(profile);

    displayResults(scores, gaps, plan);
}


// SCORING ALGORITHM
// Numbers below are just my own guesses based on stuff I've read online,
// not backed by real placement data yet. TODO: try to find real numbers later.
function calculateScores(profile) {

    const tierBonus = { '1': 30, '2': 15, '3': 5 };
    const tier = tierBonus[profile.tier] || 5;

    let cgpaBonus = 0;
    if (profile.cgpa >= 8.5) cgpaBonus = 15;
    else if (profile.cgpa >= 7.5) cgpaBonus = 10;
    else if (profile.cgpa >= 6.5) cgpaBonus = 5;

    let lcBonus = 0;
    if (profile.leetcode >= 200) lcBonus = 30;
    else if (profile.leetcode >= 100) lcBonus = 20;
    else if (profile.leetcode >= 50) lcBonus = 12;
    else if (profile.leetcode >= 20) lcBonus = 6;

    // capping projects so it can't carry the whole score by itself
    const projBonus = Math.min(profile.projects * 12, 30);

    const productSkills = ['Python', 'JavaScript', 'React', 'SQL', 'DSA'];
    const hftSkills = ['C++', 'Statistics', 'DSA'];

    const productSkillScore = profile.skills
        .filter(function(s) { return productSkills.includes(s); }).length * 8;

    const hftSkillScore = profile.skills
        .filter(function(s) { return hftSkills.includes(s); }).length * 15;

    const product = Math.min(tier + productSkillScore + lcBonus + projBonus, 100);

    const service = Math.min(tier + cgpaBonus + (lcBonus * 0.4) + 25, 100);

    const hft = Math.min((tier * 1.2) + (hftSkillScore * 2) + (lcBonus * 1.5), 100);

    return {
        product: Math.round(product),
        service: Math.round(service),
        hft: Math.round(hft)
    };
}


// GAP DETECTION
// TODO: startup gaps not built yet, only doing product + hft for now
function generateGaps(scores, profile) {
    const gaps = {};

    if (scores.product < 70) {
        gaps.product = [];
        if (profile.leetcode < 150)
            gaps.product.push('LeetCode: ' + profile.leetcode + ' solved. Need 150+ for product companies.');
        if (profile.projects < 2)
            gaps.product.push('Less than 2 projects. Interviewers need something to discuss.');
        if (!profile.skills.includes('SQL'))
            gaps.product.push('No SQL listed. Most product companies test SQL in screening.');
    }

    if (scores.hft < 50) {
        gaps.hft = [];
        if (!profile.skills.includes('C++'))
            gaps.hft.push('No C++. Required for most HFT systems.');
        if (!profile.skills.includes('Statistics'))
            gaps.hft.push('No Statistics listed. HFT round 1 is mostly probability puzzles.');
        if (profile.leetcode < 200)
            gaps.hft.push('LeetCode: ' + profile.leetcode + '. Need 200+ including Hard problems for HFT.');
    }

    return gaps;
}


// 30-DAY ACTION PLAN
// Week 1 and 2 are decently thought out. Week 3 and 4 are still generic,
// I'll make these smarter once I understand more about what actually helps.
function generate30DayPlan(profile) {
    const plan = { week1: [], week2: [], week3: [], week4: [] };

    if (profile.leetcode < 50) {
        plan.week1.push('Solve 2 LeetCode Easy every morning. Start: Two Sum, Contains Duplicate.');
    } else {
        plan.week1.push('Solve 1 Medium + 1 Easy per day. Focus: Arrays and HashMaps.');
    }

    if (profile.projects < 1) {
        plan.week1.push('Start one project today. A CLI tool or a simple webpage. Just start.');
    }

    plan.week2.push('Deploy your best project so you have a live link to share.');
    plan.week2.push('Update your LinkedIn headline with what you are building.');

    // TODO: make week 3/4 depend on the profile like week 1/2 do
    plan.week3.push('Keep pushing code to GitHub daily.');
    plan.week4.push('Apply to a few internships and ask people for feedback on your project.');

    return plan;
}


// DISPLAY RESULTS
function displayResults(scores, gaps, plan) {

    document.getElementById('results').style.display = 'block';

    const scoreColors = {
        product: '#38bdf8',
        service: '#a78bfa',
        hft: '#fbbf24'
    };

    const scoreLabels = {
        product: 'Product Companies',
        service: 'Service Companies',
        hft: 'HFT / Quant'
    };

    let scoresHtml = '<div class="result-heading">YOUR PLACEMENT PROBABILITY</div>';

    const types = ['product', 'service', 'hft'];
    types.forEach(function(type) {
        const score = scores[type];
        const color = scoreColors[type];
        const label = scoreLabels[type];

        scoresHtml += '<div class="score-row">';
        scoresHtml += '  <div class="score-label">' + label + '</div>';
        scoresHtml += '  <div class="bar-track">';
        scoresHtml += '    <div class="bar-fill" style="width:' + score + '%; background:' + color + '"></div>';
        scoresHtml += '  </div>';
        scoresHtml += '  <div class="score-number" style="color:' + color + '">' + score + '%</div>';
        scoresHtml += '</div>';
    });

    document.getElementById('scores-display').innerHTML = scoresHtml;

    let gapsHtml = '<div class="result-heading">YOUR SKILL GAPS</div>';
    const gapLabels = {
        product: 'FOR PRODUCT COMPANIES',
        hft: 'FOR HFT / QUANT'
    };

    let hasGaps = false;
    Object.keys(gaps).forEach(function(type) {
        if (gaps[type] && gaps[type].length > 0) {
            hasGaps = true;
            gapsHtml += '<p style="font-size:11px;color:#5a5a80;letter-spacing:2px;margin-bottom:8px;margin-top:16px">';
            gapsHtml += gapLabels[type] + '</p>';
            gaps[type].forEach(function(gap) {
                gapsHtml += '<div class="gap-item">✗ ' + gap + '</div>';
            });
        }
    });

    if (!hasGaps) {
        gapsHtml += '<p style="color:#00f07a;font-size:13px">No critical gaps found. Strong profile.</p>';
    }

    document.getElementById('gaps-display').innerHTML = gapsHtml;

    let planHtml = '<div class="result-heading">YOUR 30-DAY ACTION PLAN</div>';

    const weeks = [
        { key: 'week1', label: 'WEEK 1' },
        { key: 'week2', label: 'WEEK 2' },
        { key: 'week3', label: 'WEEK 3' },
        { key: 'week4', label: 'WEEK 4' },
    ];

    weeks.forEach(function(week) {
        if (plan[week.key].length > 0) {
            planHtml += '<div class="plan-week">';
            planHtml += '<h4>' + week.label + '</h4>';
            plan[week.key].forEach(function(task) {
                planHtml += '<div class="plan-item">' + task + '</div>';
            });
            planHtml += '</div>';
        }
    });

    document.getElementById('plan-display').innerHTML = planHtml;

    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}