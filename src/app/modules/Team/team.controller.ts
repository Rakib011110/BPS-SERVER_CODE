import { TeamServices } from './team.service';
import  httpStatus  from 'http-status';
// src/controllers/teamMember.controller.ts
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { teamCategories } from './team.constant';

export const createTeamMember = catchAsync(async (req: Request, res: Response) => {
  const { category } = req.body;

  if (!teamCategories.includes(category)) {
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.BAD_REQUEST,
        message: "Invalid category provide",
        data: null,
      });
  }

  const newMember = await TeamServices.createTeamMember(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Team Member created successfully!", 
    data: newMember,
  });
});

// Get All Team Members
export const getAllTeamMembers = catchAsync(async (_: Request, res: Response) => {
  const members = await TeamServices.getAllTeamMembers();
 sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "     Team Member get successfully!", 
    data: members,
  });
});

export const getTeamMembersByCategory = catchAsync(async (req: Request, res: Response) => {
  const { category } = req.params;

 

  const members = await TeamServices.getTeamMembersByCategory(category); 


  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "     Team Member get successfully!", 
    data: members,
  });
});

// Update Team Member
export const updateTeamMember = catchAsync(async (req: Request, res: Response) => {
  const updatedMember = await TeamServices.updateTeamMember(req.params.id, req.body); 

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "     Team Member updated successfully!",
    data: updatedMember,


  });

});

// Delete Team Member
export const deleteTeamMember = catchAsync(async (req: Request, res: Response) => {
  await TeamServices.deleteTeamMember(req.params.id);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Category deleted successfully!",
        data: null,
    });
    
    
    
 
});

const TeamController = {
  createTeamMember,
    getAllTeamMembers,
    getTeamMembersByCategory,
    updateTeamMember,

    deleteTeamMember,
};

export default TeamController;