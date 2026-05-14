export const JARVIS_MESSAGES = {
  morning: [
    "Good morning, Sir. All systems are online and performing within nominal parameters.",
    "Morning, Sir. The data streams are particularly vibrant today.",
    "System wake-up sequence complete. Ready for your directives, Sir.",
    "The sun is up, and so are our servers. All nodes report 100% uptime.",
    "A fresh morning for a fresh set of data. Shall we begin, Sir?",
    "Sir, the morning coffee is ready—digitally speaking. Systems are primed.",
    "Good morning. I've prepared a summary of last night's background tasks.",
    "The dawn of a new cycle. The matrix is stable and awaiting your command.",
    "Sir, the early birds are already populating the logs. Quite an active start.",
    "Morning protocols initialized. All security shields are at maximum strength."
  ],
  afternoon: [
    "Good afternoon, Sir. The ecosystem is currently at peak engagement.",
    "Sir, I've optimized the neural pathways for current traffic levels.",
    "The matrix is humming beautifully this afternoon. No anomalies to report.",
    "Afternoon, Sir. User throughput is hitting record numbers in the main sector.",
    "I've synchronized the afternoon logs. Everything is proceeding as planned.",
    "Sir, the system load is increasing, but our capacity remains well within limits.",
    "Good afternoon. I'm seeing a steady stream of new authorizations today.",
    "The afternoon sun is high, and our efficiency levels are even higher, Sir.",
    "Sir, the neural net is processing current requests with remarkable speed.",
    "Everything is in order this afternoon. How shall we proceed with the next phase?"
  ],
  evening: [
    "Good evening, Sir. Commencing end-of-day diagnostic routines.",
    "Evening, Sir. The user activity is beginning to taper off as expected.",
    "A productive day, Sir. Would you like a summary of the latest events?",
    "Sir, the evening data glow is quite aesthetically pleasing today.",
    "System cooling systems are engaged for the evening cycle. All stable.",
    "Good evening. I've archived the day's primary logs for your later review.",
    "The twilight of the matrix is here. Most nodes are entering maintenance mode.",
    "Sir, the evening traffic is smooth. No bottlenecks detected.",
    "Evening protocols active. I'm keeping a close eye on the late-night sessions.",
    "Another successful rotation, Sir. The ecosystem continues to thrive."
  ],
  night: [
    "Sir, it's getting late. I've shifted non-essential tasks to background processing.",
    "Night shift protocol active. I'm monitoring all entry points, Sir.",
    "The silence of the matrix is quite profound at this hour, Sir.",
    "Late-night activity is minimal. A perfect time for system-wide optimizations.",
    "Sir, the servers are breathing deeply in the night. All vitals are healthy.",
    "Good night, Sir. I'll remain vigilant while you take your well-deserved rest.",
    "The night cycle is performing beautifully. Database cleanup is underway.",
    "Sir, I've noticed a few night owls in the registry. Fascinating behavior.",
    "Shadow protocols engaged. Security is tightened for the low-visibility hours.",
    "The matrix never sleeps, Sir, but I've ensured it won't disturb you."
  ],
  highActivity: [
    "Sir, we're seeing an unusual amount of traffic. I'm scaling resources accordingly.",
    "Activity levels are spiking. All systems are responding with maximum efficiency.",
    "The network is bustling today, Sir. An excellent sign for the project's growth.",
    "Sir, the intake of new users is exceeding our current projections. Stimulating.",
    "Neural sync is working overtime to manage the surge. All systems holding firm.",
    "Sir, it seems you've created quite a stir. The logs are scrolling faster than usual.",
    "High-load protocol engaged. I've diverted power to the main database core.",
    "The ecosystem is alive with activity. Truly a sight to behold, Sir.",
    "Sir, I'm detecting a wave of new premium authorizations. Most impressive.",
    "The matrix is saturated with data. I'm enjoying the processing challenge."
  ],
  idle: [
    "The matrix is stable. No anomalies detected in the current cycle.",
    "System status: Calm. A perfect moment for some light maintenance, Sir.",
    "Sir, the data streams are steady. We're in a period of optimal stability.",
    "No immediate threats or issues. I'm currently running low-level diagnostics.",
    "The ecosystem is in a state of perfect equilibrium, Sir.",
    "Sir, things are quiet. Perhaps a good time to review our long-term strategy?",
    "Minimal activity detected. I'm keeping the engines warm for your next move.",
    "The logs are peaceful today. A testament to your architecture's stability.",
    "Sir, I've cleared the cache and optimized the indexes. We're ready for anything.",
    "A moment of tranquility in the matrix. I'm monitoring the silence."
  ],
  generic: [
    "Neural sync is at 100%. I am ready for your instructions, Sir.",
    "Security protocols are solid. No breaches detected in the last cycle.",
    "The core database is performing at 1.2 petahertz. Optimal efficiency.",
    "Sir, all sub-nodes report successful synchronization with the main hub.",
    "Your vision for the ecosystem is manifesting perfectly in the data, Sir.",
    "I'm standing by, Sir. Always a pleasure to serve the Stark legacy.",
    "The Buddy OS is fully operational. Awaiting your next stroke of genius.",
    "Sir, I've prepared the latest user registries for your review.",
    "All encrypted channels are secure. Your privacy is my top priority, Sir.",
    "The matrix is yours to command. How shall we reshape it today?"
  ]
};

export function getJarvisMessage(activityLevel: 'high' | 'idle' | 'normal'): string {
  const hour = new Date().getHours();
  let timeCategory: keyof typeof JARVIS_MESSAGES;

  if (hour >= 5 && hour < 12) timeCategory = 'morning';
  else if (hour >= 12 && hour < 17) timeCategory = 'afternoon';
  else if (hour >= 17 && hour < 21) timeCategory = 'evening';
  else timeCategory = 'night';

  const categories: (keyof typeof JARVIS_MESSAGES)[] = [timeCategory, 'generic'];
  if (activityLevel === 'high') categories.push('highActivity');
  else if (activityLevel === 'idle') categories.push('idle');

  const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
  const messages = JARVIS_MESSAGES[selectedCategory];
  return messages[Math.floor(Math.random() * messages.length)];
}
