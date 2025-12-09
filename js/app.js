document.addEventListener('DOMContentLoaded', () => {
    if (window.dashboardData) {
        renderDashboard(window.dashboardData);
    } else {
        console.error('Dashboard data not found. Ensure dashboard_data.js is loaded.');
        alert('Data not found. Please run analyze_feedback.py first.');
    }

    // Navigation Logic
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.content-view');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');

            // Update Nav State
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Update View State
            views.forEach(v => {
                v.style.display = 'none';
                v.classList.remove('active');
            });
            const targetView = document.getElementById(targetId);
            targetView.style.display = 'block';
            setTimeout(() => targetView.classList.add('active'), 10); // Fade in effect
        });
    });
});

function renderDashboard(data) {
    renderMetrics(data.metrics);
    renderCharts(data.charts);
    setupFilters(data.raw_data);
    populateAnalytics(data.raw_data);
    populateEvents(data.charts.event_ratings);
}

function populateAnalytics(data) {
    const tbody = document.getElementById('analyticsTableBody');
    tbody.innerHTML = '';
    // Show top 50 recs to avoid lag
    data.slice(0, 50).forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${d.Event_Name}</td>
            <td>${d.Department}</td>
            <td>${d.Rating}</td>
            <td>${d.Sentiment}</td>
            <td style="color: #94a3b8; font-size: 0.9em;">${d.Comments.substring(0, 30)}...</td>
        `;
        tbody.appendChild(tr);
    });
}

function populateEvents(eventRatings) {
    const container = document.getElementById('events-list-container');
    container.innerHTML = '';
    Object.entries(eventRatings).forEach(([event, rating]) => {
        const card = document.createElement('div');
        card.className = 'kpi-card';
        card.innerHTML = `
            <h3>${event}</h3>
            <p class="kpi-value">${rating}</p>
            <span class="trend">${rating > 3 ? 'Good Performance' : 'Needs Attention'}</span>
        `;
        container.appendChild(card);
    });
}

function renderMetrics(metrics) {
    document.getElementById('total-responses').innerText = metrics.total_responses;
    document.getElementById('avg-rating').innerText = metrics.avg_rating;
    document.getElementById('top-event').innerText = metrics.top_event;
    document.getElementById('avg-satisfaction').innerText = metrics.avg_satisfaction + '%';
}

let charts = {};

function renderCharts(chartData) {
    // 1. Ratings Distribution (Bar)
    createChart('ratingsChart', 'bar', Object.keys(chartData.ratings_dist), Object.values(chartData.ratings_dist), 'Distribution of Ratings', '#38bdf8');

    // 2. Sentiment Distribution (Doughnut)
    createChart('sentimentChart', 'doughnut', Object.keys(chartData.sentiment_dist), Object.values(chartData.sentiment_dist), 'Sentiment Breakdown', ['#4ade80', '#94a3b8', '#f87171']);

    // 3. Avg Rating by Event (Horizontal Bar)
    createChart('eventRatingsChart', 'bar', Object.keys(chartData.event_ratings), Object.values(chartData.event_ratings), 'Avg Rating per Event', '#818cf8', { indexAxis: 'y' });

    // 4. Dept Satisfaction (Bar)
    createChart('deptSatisfactionChart', 'bar', Object.keys(chartData.dept_satisfaction), Object.values(chartData.dept_satisfaction), 'Satisfaction Score by Dept', '#c084fc');

    // 5. Feedback Categories (Pie)
    createChart('categoryChart', 'pie', Object.keys(chartData.category_counts), Object.values(chartData.category_counts), 'Feedback Topics', ['#f472b6', '#fb923c', '#fbbf24', '#a3e635', '#22d3ee']);

    // 6. Word Cloud (HTML List for simple implementation without complex lib)
    renderWordCloud(chartData.word_cloud);
}

function createChart(canvasId, type, labels, data, label, backgroundColor, options = {}) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Destroy existing if re-rendering
    if (charts[canvasId]) {
        charts[canvasId].destroy();
    }

    charts[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8' }
                },
                title: {
                    display: true,
                    text: label,
                    color: '#f8fafc'
                }
            },
            scales: type.includes('bar') ? {
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
            } : {},
            ...options
        }
    });
}

function renderWordCloud(wordFreq) {
    const container = document.getElementById('wordCloudContainer');
    container.innerHTML = '';

    // Normalizing size
    const maxFreq = Math.max(...Object.values(wordFreq));

    Object.entries(wordFreq).forEach(([word, freq]) => {
        const span = document.createElement('span');
        span.innerText = word;
        const size = 0.8 + (freq / maxFreq) * 1.5; // Scale 0.8rem to 2.3rem
        span.style.fontSize = `${size}rem`;
        span.style.color = `hsl(${Math.random() * 360}, 70%, 70%)`;
        span.style.margin = '0 8px';
        span.style.display = 'inline-block';
        container.appendChild(span);
    });
}

function setupFilters(rawData) {
    // Populate select options
    const depts = [...new Set(rawData.map(d => d.Department))];
    const deptSelect = document.getElementById('deptFilter');
    depts.forEach(d => {
        const option = document.createElement('option');
        option.value = d;
        option.innerText = d;
        deptSelect.appendChild(option);
    });

    // Event listener for Filters
    document.getElementById('applyFilters').addEventListener('click', () => {
        const selectedDept = deptSelect.value;
        const filteredData = selectedDept === 'all'
            ? rawData
            : rawData.filter(d => d.Department === selectedDept);

        updateDashboard(filteredData);
    });

    // Event listener for Export
    document.getElementById('exportReport').addEventListener('click', () => {
        window.print();
    });
}

function updateDashboard(data) {
    // 1. Update Metrics
    updateMetricsFromFiltered(data);

    // 2. Re-aggregate data for charts
    // Ideally this aggregation logic should be shared with backend or utility, 
    // but replicating simple counts here for client-side interactivity.

    // Ratings Dist
    const ratingsDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach(d => ratingsDist[d.Rating] = (ratingsDist[d.Rating] || 0) + 1);

    // Sentiment Dist
    const sentimentDist = {};
    data.forEach(d => sentimentDist[d.Sentiment] = (sentimentDist[d.Sentiment] || 0) + 1);

    // Event Ratings
    const eventRatings = {};
    const eventCounts = {};
    data.forEach(d => {
        eventRatings[d.Event_Name] = (eventRatings[d.Event_Name] || 0) + d.Rating;
        eventCounts[d.Event_Name] = (eventCounts[d.Event_Name] || 0) + 1;
    });
    // Average
    Object.keys(eventRatings).forEach(e => eventRatings[e] = (eventRatings[e] / eventCounts[e]).toFixed(2));

    // Dept Satisfaction (Satisfaction Score calculation needed if dynamic, or just Rating for simplicity)
    // Using simple Avg Rating for dynamic filter to avoid complex formula calc client-side
    // Or approximate Score: ((Rating-1)/4 + (Sentiment=='Positive'?1:0))/2 * 100 roughly
    // Let's stick to Avg Rating for simplicity in this update or strictly Department counts.
    // Actually, let's keep it consistent: Dept Satisfaction usually static, but if filtered by Dept, 
    // it will show only 1 bar. That's fine.

    // Dept Satisfaction aggregation
    const deptScores = {};
    const deptCounts = {};
    data.forEach(d => {
        // approx score from backend logic: ((Rating-1)/4 + polarity)/2 * 100
        // We don't have polarity in raw_json usually unless added.
        // Let's use Rating * 20 as proxy for Score for client-side update speed
        const score = d.Rating * 20;
        deptScores[d.Department] = (deptScores[d.Department] || 0) + score;
        deptCounts[d.Department] = (deptCounts[d.Department] || 0) + 1;
    });
    Object.keys(deptScores).forEach(d => deptScores[d] = (deptScores[d] / deptCounts[d]).toFixed(1));


    // Category Counts
    const catCounts = {};
    data.forEach(d => catCounts[d.Category] = (catCounts[d.Category] || 0) + 1);

    // 3. Update Charts
    updateChartData('ratingsChart', Object.keys(ratingsDist), Object.values(ratingsDist));
    updateChartData('sentimentChart', Object.keys(sentimentDist), Object.values(sentimentDist));
    updateChartData('eventRatingsChart', Object.keys(eventRatings), Object.values(eventRatings));
    updateChartData('deptSatisfactionChart', Object.keys(deptScores), Object.values(deptScores));
    updateChartData('categoryChart', Object.keys(catCounts), Object.values(catCounts));

    // Word cloud update is tricky without text processing lib, skipping for now or clear it
}

function updateChartData(canvasId, labels, data) {
    if (charts[canvasId]) {
        charts[canvasId].data.labels = labels;
        charts[canvasId].data.datasets[0].data = data;
        charts[canvasId].update();
    }
}

function updateMetricsFromFiltered(data) {
    const total = data.length;
    const avgR = total ? (data.reduce((acc, curr) => acc + curr.Rating, 0) / total).toFixed(2) : 0;

    document.getElementById('total-responses').innerText = total;
    document.getElementById('avg-rating').innerText = avgR;
    // Update others if needed
}
