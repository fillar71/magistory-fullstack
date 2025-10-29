let stories = [];

export const createStory = (req, res) => {
  const { title, content } = req.body;
  const newStory = { id: Date.now(), title, content };
  stories.push(newStory);
  res.json(newStory);
};

export const getStories = (req, res) => {
  res.json(stories);
};
