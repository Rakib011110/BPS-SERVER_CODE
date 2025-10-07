import { catchAsync } from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { UserServices } from "./user.services";

const createUsers = catchAsync(async (req, res) => {
  const user = await UserServices.createUserIntoDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Created Successfully",
    data: user,
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const users = await UserServices.getAllUsersFromDb();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users fetched successfully",
    data: users,
  });
});

const getAUser = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const user = await UserServices.getAUserFromDb(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User fetched successfully",
    data: user,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const userId = req.params.id;

  console.log("Update user request for ID:", userId);
  console.log("Request body:", req.body);

  // Handle file uploads if present
  const updateData = { ...req.body };

  // Parse jobExperiences if it's a JSON string
  if (
    updateData.jobExperiences &&
    typeof updateData.jobExperiences === "string"
  ) {
    try {
      updateData.jobExperiences = JSON.parse(updateData.jobExperiences);
      console.log("Parsed jobExperiences:", updateData.jobExperiences);
    } catch (error) {
      console.error("Error parsing jobExperiences:", error);
      // If parsing fails, set to empty array
      updateData.jobExperiences = [];
    }
  }

  // Parse affiliation dates with improved validation
  if (
    updateData.affiliationStartDate &&
    typeof updateData.affiliationStartDate === "string"
  ) {
    try {
      const dateStr = updateData.affiliationStartDate.trim();
      if (dateStr) {
        // Handle both dd-mm-yyyy and yyyy-mm-dd formats
        let parsedDate;
        if (dateStr.includes("-")) {
          const parts = dateStr.split("-");
          if (parts.length === 3) {
            // Check if first part is year (4 digits) or day (1-2 digits)
            if (parts[0].length === 4) {
              // yyyy-mm-dd format
              parsedDate = new Date(dateStr);
            } else {
              // dd-mm-yyyy format
              const [day, month, year] = parts;
              parsedDate = new Date(`${year}-${month}-${day}`);
            }
          }
        } else {
          parsedDate = new Date(dateStr);
        }

        // Validate the parsed date
        if (parsedDate && !isNaN(parsedDate.getTime())) {
          updateData.affiliationStartDate = parsedDate;
          console.log(
            "Parsed affiliationStartDate:",
            updateData.affiliationStartDate
          );
        } else {
          console.error("Invalid affiliationStartDate format:", dateStr);
          updateData.affiliationStartDate = undefined;
        }
      } else {
        updateData.affiliationStartDate = undefined;
      }
    } catch (error) {
      console.error("Error parsing affiliationStartDate:", error);
      updateData.affiliationStartDate = undefined;
    }
  }

  if (
    updateData.affiliationValidTill &&
    typeof updateData.affiliationValidTill === "string"
  ) {
    try {
      const dateStr = updateData.affiliationValidTill.trim();
      if (dateStr) {
        // Handle both dd-mm-yyyy and yyyy-mm-dd formats
        let parsedDate;
        if (dateStr.includes("-")) {
          const parts = dateStr.split("-");
          if (parts.length === 3) {
            // Check if first part is year (4 digits) or day (1-2 digits)
            if (parts[0].length === 4) {
              // yyyy-mm-dd format
              parsedDate = new Date(dateStr);
            } else {
              // dd-mm-yyyy format
              const [day, month, year] = parts;
              parsedDate = new Date(`${year}-${month}-${day}`);
            }
          }
        } else {
          parsedDate = new Date(dateStr);
        }

        // Validate the parsed date
        if (parsedDate && !isNaN(parsedDate.getTime())) {
          updateData.affiliationValidTill = parsedDate;
          console.log(
            "Parsed affiliationValidTill:",
            updateData.affiliationValidTill
          );
        } else {
          console.error("Invalid affiliationValidTill format:", dateStr);
          updateData.affiliationValidTill = undefined;
        }
      } else {
        updateData.affiliationValidTill = undefined;
      }
    } catch (error) {
      console.error("Error parsing affiliationValidTill:", error);
      updateData.affiliationValidTill = undefined;
    }
  }

  if (req.files) {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    console.log("Files received:", Object.keys(files));

    // Handle profile photo
    if (files.profilePhoto && files.profilePhoto[0]) {
      updateData.profilePhoto = `/uploads/profilephoto/${files.profilePhoto[0].filename}`;
    }

    // Handle CV file
    if (files.cvFile && files.cvFile[0]) {
      updateData.cvUrl = `/uploads/profiledocs/${files.cvFile[0].filename}`;
    }

    // Handle experience certificate
    if (files.experienceCertificateFile && files.experienceCertificateFile[0]) {
      updateData.experienceCertificateUrl = `/uploads/profiledocs/${files.experienceCertificateFile[0].filename}`;
    }

    // Handle university certificate
    if (files.universityCertificateFile && files.universityCertificateFile[0]) {
      updateData.universityCertificateUrl = `/uploads/profiledocs/${files.universityCertificateFile[0].filename}`;
    }

    // Handle affiliation document
    if (files.affiliationDocumentFile && files.affiliationDocumentFile[0]) {
      updateData.affiliationDocument = `/uploads/profiledocs/${files.affiliationDocumentFile[0].filename}`;
    }
  }

  console.log("Final update data:", updateData);

  // Final validation to ensure no invalid dates are passed to database
  if (
    updateData.affiliationStartDate &&
    updateData.affiliationStartDate instanceof Date &&
    isNaN(updateData.affiliationStartDate.getTime())
  ) {
    console.warn(
      "Removing invalid affiliationStartDate before database update"
    );
    delete updateData.affiliationStartDate;
  }

  if (
    updateData.affiliationValidTill &&
    updateData.affiliationValidTill instanceof Date &&
    isNaN(updateData.affiliationValidTill.getTime())
  ) {
    console.warn(
      "Removing invalid affiliationValidTill before database update"
    );
    delete updateData.affiliationValidTill;
  }

  const updatedUserData = await UserServices.updpateUserInDb(
    userId,
    updateData
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User updated successfully",
    data: {
      user: updatedUserData.user,
      accessToken: updatedUserData.accessToken,
    },
  });
});

const uploadProfilePhoto = catchAsync(async (req, res) => {
  const userId = req.params.id;

  if (!req.file) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: "No file uploaded",
      data: null,
    });
  }

  // Create the file path for storing in database
  const profilePhotoPath = `/uploads/profilephoto/${req.file.filename}`;

  // Update user with new profile photo
  const updatedUser = await UserServices.updpateUserInDb(userId, {
    profilePhoto: profilePhotoPath,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Profile photo uploaded successfully",
    data: {
      user: updatedUser,
      profilePhoto: profilePhotoPath,
    },
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const deletedUser = await UserServices.deleteUserFromDb(userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User deleted successfully",
    data: deletedUser,
  });
});

const updateUserStatus = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const { status } = req.body;

  const user = await UserServices.updateUserStatus(userId, status);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User status updated successfully",
    data: user,
  });
});

const updateUserRole = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  const user = await UserServices.updateUserRole(userId, role);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User role updated successfully",
    data: user,
  });
});

const adminResetPassword = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const { newPassword } = req.body;

  const result = await UserServices.adminResetPassword(userId, newPassword);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Password reset successfully",
    data: result,
  });
});

export const UserControllers = {
  createUsers,
  getAllUsers,
  getAUser,
  deleteUser,
  updateUser,
  uploadProfilePhoto,
  updateUserStatus,
  updateUserRole,
  adminResetPassword,
};
