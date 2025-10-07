import { Request } from 'express';

/**
 * Constructs a full URL for an image path
 * @param imagePath - The relative image path stored in database
 * @param req - Express request object to get the base URL
 * @returns Full URL to the image
 */
export const getImageUrl = (imagePath: string, req: Request): string => {
  if (!imagePath) return '';
  
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Construct full URL
  const protocol = req.secure ? 'https' : 'http';
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}`;
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  
  return `${baseUrl}/${cleanPath}`;
};

/**
 * Processes quiz data to include full image URLs
 * @param quiz - Quiz object that may contain image paths
 * @param req - Express request object
 * @returns Quiz object with full image URLs
 */
export const processQuizImageUrls = (quiz: any, req: Request) => {
  if (!quiz) return quiz;
  
  const processedQuiz = {
    ...quiz,
    descriptionImage: quiz.descriptionImage ? getImageUrl(quiz.descriptionImage, req) : undefined
  };
  
  // If quiz is a mongoose document, convert to plain object
  return quiz.toObject ? processedQuiz : processedQuiz;
};

/**
 * Processes questions data to include full image URLs
 * @param questions - Array of question objects that may contain image paths
 * @param req - Express request object
 * @returns Array of questions with full image URLs
 */
export const processQuestionsImageUrls = (questions: any[], req: Request) => {
  if (!questions || !Array.isArray(questions)) return questions;
  
  return questions.map(question => {
    const processedQuestion = {
      ...question,
      questionImage: question.questionImage ? getImageUrl(question.questionImage, req) : undefined,
      options: question.options?.map((option: any) => ({
        ...option,
        image: option.image ? getImageUrl(option.image, req) : undefined
      })) || []
    };
    
    // If question is a mongoose document, convert to plain object
    return question.toObject ? processedQuestion : processedQuestion;
  });
};
