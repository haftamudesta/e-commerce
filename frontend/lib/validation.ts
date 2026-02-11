import { z } from "zod";

export const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be less than 50 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),

    email: z.string().email("Please enter a valid email address"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/\d/, "Password must contain at least one number"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .trim(),
  
  password: z.string()
    .min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const deleteAccountSchema = z.object({
  password: z.string()
    .min(1, 'Password is required for confirmation')
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
  
  confirmText: z.string()
    .refine((val) => val === 'DELETE MY ACCOUNT', {
      message: 'Please type "DELETE MY ACCOUNT" to confirm',
    })
    .optional(),
});

export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;

export const profileUpdateSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional()
    .or(z.literal('')),
  
  email: z.string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  
  currentPassword: z.string()
    .min(1, 'Current password is required when changing password')
    .optional()
    .or(z.literal('')),
  
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .optional()
    .or(z.literal('')),
})
.refine(
  (data) => {
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  },
  {
    message: 'Current password is required to set new password',
    path: ['currentPassword'],
  }
)
.refine(
  (data) => {
    if (data.currentPassword && !data.newPassword) {
      return false;
    }
    return true;
  },
  {
    message: 'New password is required when providing current password',
    path: ['newPassword'],
  }
);

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;


