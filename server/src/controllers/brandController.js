import Brand from "../models/Brand.js";

export async function createBrand(req, res) {
  try {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }

    const brand = await Brand.create({ name: name.trim() });
    return res.status(201).json(brand);
  } catch (err) {
    console.error("createBrand error:", err.message);
    return res.status(500).json({ message: "Failed to create brand" });
  }
}

export async function listBrands(_req, res) {
  try {
    const brands = await Brand.find()
      .select("_id name createdAt")
      .sort({ createdAt: -1 });

    return res.json(brands);
  } catch (err) {
    console.error("listBrands error:", err.message);
    return res.status(500).json({ message: "Failed to list brands" });
  }
}

export async function getBrandById(req, res) {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    return res.json(brand);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(404).json({ message: "Brand not found" });
    }
    console.error("getBrandById error:", err.message);
    return res.status(500).json({ message: "Failed to get brand" });
  }
}
