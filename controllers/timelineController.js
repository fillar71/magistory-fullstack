let timelines = [];

export const addTimelineEvent = (req, res) => {
  const { year, event } = req.body;
  if (!year || !event)
    return res.status(400).json({ error: "Year and event are required" });

  const newEvent = { id: Date.now(), year, event };
  timelines.push(newEvent);
  res.json(newEvent);
};

export const getTimeline = (req, res) => {
  res.json(timelines.sort((a, b) => a.year - b.year));
};
