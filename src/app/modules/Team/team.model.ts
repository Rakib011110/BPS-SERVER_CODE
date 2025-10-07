// // src/models/teamMember.model.ts
// import mongoose, { Schema, Document } from "mongoose";

// export type TeamMemberType = Document & {
//   name: string;
//   title: string;
//   photoUrl: string;
//   category: string;
// };

// const teamMemberSchema = new Schema<TeamMemberType>({
//   name: { type: String, required: true },
//   title: { type: String, required: true },
//   photoUrl: { type: String, required: true },
//   category: { 
//     type: String, 
//     required: true,
    
//   },
// });

// const TeamMemberModel = mongoose.model<TeamMemberType>("TeamMember", teamMemberSchema);

// export default TeamMemberModel;
