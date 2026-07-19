import { Router } from "express";
import {
  createBrand,
  listBrands,
  getBrandById,
} from "../controllers/brandController.js";

const router = Router();

router.post("/", createBrand);
router.get("/", listBrands);
router.get("/:id", getBrandById);

export default router;
