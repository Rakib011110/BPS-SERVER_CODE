// src/routes/teamMember.routes.ts
import express from "express";
import TeamController from "./team.controller";

const router = express.Router();

// CRUD routes
router.post("/create-team", TeamController.createTeamMember);
router.get("/", TeamController.getAllTeamMembers);
router.get("/:id", TeamController.getTeamMembersByCategory);
router.put("/:id", TeamController.updateTeamMember);
router.delete("/:id", TeamController.deleteTeamMember);

export const TeamRouter = router;
