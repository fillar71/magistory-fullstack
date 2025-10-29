export const getTimeline = (req, res) => {
  res.json({ message: "Get Timeline OK" });
};

export const postTimeline = (req, res) => {
  const data = req.body;
  // Simulasikan penyimpanan ke database atau memori
  res.json({ message: "Timeline berhasil disimpan", data });
};
