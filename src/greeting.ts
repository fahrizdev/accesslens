export function greetingFor(date: Date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12)
    return { text: "Good morning", period: "morning" };
  if (hour >= 12 && hour < 17)
    return { text: "Good afternoon", period: "afternoon" };
  if (hour >= 17 && hour < 22)
    return { text: "Good evening", period: "evening" };
  return { text: "Welcome back", period: "night" };
}
