// controllers/timelineController.js

let timelineData = [
  { id: 1, title: "Welcome to Magistory!", description: "Your creative AI timeline starts here." }
];

// GET timeline
export const getTimeline = (req, res) => {
  res.json(timelineData);
};

// POST timeline
export const postTimeline = (req, res) => {
  const { title, description } = req.body;
  const newItem = {
    id: timelineData.length + 1,
    title,
    description
  };
  timelineData.push(newItem);
  res.status(201).json({ message: "Timeline added successfully", item: newItem });
};
