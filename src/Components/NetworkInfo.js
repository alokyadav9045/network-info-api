import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import './NetworkInfo.css';

const getMaxDownlinkApprox = (type) => {
  switch (type) {
    case '5g': return '100.00';
    case '4g': return '20.00';
    case '3g': return '3.00';
    case '2g': return '0.30';
    case 'slow-2g': return '0.10';
    default: return '1.00';
  }
};

const getLatencyCategory = (rtt) => {
  if (rtt <= 50) return '🟢 Low';
  if (rtt <= 150) return '🟡 Medium';
  return '🔴 High';
};

const NetworkInfo = () => {
  const [networkInfo, setNetworkInfo] = useState({
    effectiveType: '',
    downlink: '',
    rtt: '',
    saveData: false,
    type: '',
    downlinkMax: '',
  });

  const [darkMode, setDarkMode] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const lastSpeed = useRef(0);

  const updateNetworkStats = () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      const effective = connection.effectiveType || '';
      const is5G = effective === '4g' && connection.downlink > 50;
      const adjustedType = is5G ? '5g' : effective;

      const downlink = (connection.downlink + Math.random() * 0.5).toFixed(2);

      setNetworkInfo({
        effectiveType: adjustedType,
        downlink,
        rtt: connection.rtt || '',
        saveData: connection.saveData || false,
        type: connection.type || 'unknown',
        downlinkMax: connection.downlinkMax
          ? connection.downlinkMax.toFixed(2)
          : getMaxDownlinkApprox(adjustedType),
      });

      // Update chart
      if (chartInstance.current) {
        const now = new Date().toLocaleTimeString();
        const chart = chartInstance.current;
        const color = parseFloat(downlink) >= lastSpeed.current ? 'green' : 'red';
        lastSpeed.current = parseFloat(downlink);

        chart.data.labels.push(now);
        chart.data.datasets[0].data.push({ x: now, y: downlink });
        chart.data.datasets[0].borderColor.push(color);

        if (chart.data.labels.length > 20) {
          chart.data.labels.shift();
          chart.data.datasets[0].data.shift();
          chart.data.datasets[0].borderColor.shift();
        }

        chart.update();
      }
    }
  };

  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    updateNetworkStats();
    const interval = setInterval(updateNetworkStats, 2000);

    if (connection) {
      connection.addEventListener('change', updateNetworkStats);
    }

    return () => {
      clearInterval(interval);
      if (connection) connection.removeEventListener('change', updateNetworkStats);
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: '📶 Speed (Mbps)',
          data: [],
          borderColor: [],
          backgroundColor: 'rgba(0,0,0,0.1)',
          pointRadius: 3,
          borderWidth: 2,
          fill: true,
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            suggestedMax: 100,
            ticks: {
              color: darkMode ? '#fff' : '#000'
            }
          },
          x: {
            ticks: {
              color: darkMode ? '#fff' : '#000'
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: darkMode ? '#fff' : '#000'
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [darkMode]);

  return (
    <div className={`network-container ${darkMode ? 'dark' : ''}`}>
      <button className="toggle-button" onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
      </button>

      <h2>📡 Real-Time Network Info</h2>

      <div className="network-card">
        <p><strong>Connection Type:</strong> {networkInfo.type}</p>
        <p><strong>Effective Type:</strong> {networkInfo.effectiveType.toUpperCase()}</p>
        <p><strong>Downlink:</strong> {networkInfo.downlink} Mbps</p>
        <p><strong>Max Downlink:</strong> {networkInfo.downlinkMax} Mbps</p>
        <p><strong>RTT:</strong> {networkInfo.rtt} ms</p>
        <p><strong>Latency:</strong> {getLatencyCategory(networkInfo.rtt)}</p>
        <p><strong>Data Saver:</strong> {networkInfo.saveData ? '🟠 Enabled' : '🟢 Disabled'}</p>
      </div>

      <div className="chart-wrapper">
        <canvas ref={chartRef}></canvas>
      </div>
      <div className="footer">
        <p>Network Info API </p>
        <p>© 2025 Alok Yadav</p>
      </div>
    </div>
  );
};

export default NetworkInfo;
