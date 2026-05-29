import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './modules/auth/auth.routes';
import { sendError } from './utils/response';

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // Cho phép load ảnh trên app/web
}));

// Rate Limiting (Chống Spam/DDoS)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 200, // Limit 200 requests per windowMs cho mỗi IP
  message: { success: false, message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static files (ảnh selfie chấm công)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

import userRoutes from './modules/users/user.routes';
import roleRoutes from './modules/roles/role.routes';

import departmentRoutes from './modules/departments/department.routes';
import employeeRoutes from './modules/employees/employee.routes';
import customerRoutes from './modules/customers/customer.routes';
import taskRoutes from './modules/tasks/task.routes';
import ticketRoutes from './modules/tickets/ticket.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import activityLogRoutes from './modules/activity-logs/activity-log.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import leaveRoutes from './modules/leaves/leave.routes';
import payrollRoutes from './modules/payroll/payroll.routes';
import notificationRoutes from './modules/notifications/notification.routes';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  sendError(res, err.status || 500, err.message || 'Internal Server Error');
});

export default app;
