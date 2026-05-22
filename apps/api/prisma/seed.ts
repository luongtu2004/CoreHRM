import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Roles ──────────────────────────────────────────────
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: { name: 'Super Admin', description: 'Super Administrator with full access' }
  });
  const staffRole = await prisma.role.upsert({
    where: { name: 'Staff' }, update: {}, create: { name: 'Staff', description: 'General Staff' }
  });
  await prisma.role.upsert({ where: { name: 'Manager' }, update: {}, create: { name: 'Manager', description: 'Department Manager' } });
  await prisma.role.upsert({ where: { name: 'HR' }, update: {}, create: { name: 'HR' } });
  await prisma.role.upsert({ where: { name: 'Sales' }, update: {}, create: { name: 'Sales' } });
  await prisma.role.upsert({ where: { name: 'Support' }, update: {}, create: { name: 'Support' } });

  // ── Permissions ────────────────────────────────────────
  const allModules = ['users', 'roles', 'departments', 'employees', 'customers', 'tasks', 'tickets'];
  const actions = ['create', 'read', 'update', 'delete'];
  const permissions = [];
  for (const module of allModules) {
    for (const action of actions) {
      const p = await prisma.permission.upsert({
        where: { module_action: { module, action } },
        update: {},
        create: { name: `${action} ${module}`, module, action }
      });
      permissions.push(p);
    }
  }
  for (const p of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: superAdminRole.id, permissionId: p.id }
    });
  }

  // ── Admin User ─────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('123456', 10);
  let adminUser = await prisma.user.findUnique({ where: { email: 'admin@example.com' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: { name: 'System Admin', email: 'admin@example.com', password: hashedPassword, status: 'ACTIVE' }
    });
    await prisma.userRole.create({ data: { userId: adminUser.id, roleId: superAdminRole.id } });
  }

  // ── Extra Users ────────────────────────────────────────
  const users: any[] = [];
  const userData = [
    { name: 'Nguyễn Văn An', email: 'an.nguyen@company.com' },
    { name: 'Trần Thị Bình', email: 'binh.tran@company.com' },
    { name: 'Lê Minh Cường', email: 'cuong.le@company.com' },
    { name: 'Phạm Thu Hà', email: 'ha.pham@company.com' },
    { name: 'Hoàng Đức Long', email: 'long.hoang@company.com' },
    { name: 'Vũ Thị Mai', email: 'mai.vu@company.com' },
    { name: 'Đặng Quốc Nam', email: 'nam.dang@company.com' },
    { name: 'Bùi Thị Oanh', email: 'oanh.bui@company.com' },
    { name: 'Ngô Văn Phúc', email: 'phuc.ngo@company.com' },
    { name: 'Lý Thị Quỳnh', email: 'quynh.ly@company.com' },
    { name: 'Đinh Văn Sang', email: 'sang.dinh@company.com' },
    { name: 'Cao Thị Thảo', email: 'thao.cao@company.com' },
    { name: 'Hồ Minh Tuấn', email: 'tuan.ho@company.com' },
    { name: 'Lưu Thị Uyên', email: 'uyen.luu@company.com' },
    { name: 'Trịnh Văn Vinh', email: 'vinh.trinh@company.com' },
    { name: 'Phan Thị Xuân', email: 'xuan.phan@company.com' },
    { name: 'Dương Minh Yên', email: 'yen.duong@company.com' },
    { name: 'Tạ Văn Hùng', email: 'hung.ta@company.com' },
    { name: 'Kiều Thị Lan', email: 'lan.kieu@company.com' },
    { name: 'Mạc Văn Đại', email: 'dai.mac@company.com' },
  ];
  for (const u of userData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, password: hashedPassword, status: 'ACTIVE' }
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: staffRole.id } },
      update: {},
      create: { userId: user.id, roleId: staffRole.id }
    });
    users.push(user);
  }

  // ── Departments ────────────────────────────────────────
  // Department model has: id, name, description, managerId, status
  const deptData = [
    { name: 'Engineering', description: 'Software Development Team' },
    { name: 'Sales', description: 'Sales & Business Development' },
    { name: 'Human Resources', description: 'HR & Recruitment' },
    { name: 'Marketing', description: 'Marketing & Brand' },
    { name: 'Support', description: 'Customer Support' },
  ];
  const departments: any[] = [];
  for (const d of deptData) {
    // Use findFirst then create to avoid upsert unique issue
    let dept = await prisma.department.findFirst({ where: { name: d.name } });
    if (!dept) {
      dept = await prisma.department.create({
        data: { ...d, managerId: adminUser.id }
      });
    }
    departments.push(dept);
  }

  // ── Employees ──────────────────────────────────────────
  // Employee model has: position (not jobTitle), no salary field... check schema
  // Schema shows: position, dateOfBirth, gender, address, startDate, salary, status
  const employeeData = [
    { userId: users[0].id, deptId: departments[0].id, position: 'Senior Developer', employeeCode: 'EMP001', salary: 2500 },
    { userId: users[1].id, deptId: departments[1].id, position: 'Sales Executive', employeeCode: 'EMP002', salary: 1800 },
    { userId: users[2].id, deptId: departments[0].id, position: 'Frontend Developer', employeeCode: 'EMP003', salary: 2000 },
    { userId: users[3].id, deptId: departments[2].id, position: 'HR Specialist', employeeCode: 'EMP004', salary: 1600 },
    { userId: users[4].id, deptId: departments[3].id, position: 'Marketing Lead', employeeCode: 'EMP005', salary: 2200 },
  ];
  for (const e of employeeData) {
    await prisma.employee.upsert({
      where: { employeeCode: e.employeeCode },
      update: {},
      create: {
        userId: e.userId,
        departmentId: e.deptId,
        position: e.position,
        employeeCode: e.employeeCode,
        salary: e.salary,
        startDate: new Date('2023-01-15'),
        status: 'ACTIVE'
      }
    });
  }

  // ── Customers ──────────────────────────────────────────
  // Customer model: name, email, phone, companyName, source, status, assignedTo, note
  const customerData = [
    { name: 'ABC Technology Co.', email: 'contact@abc-tech.vn', phone: '0901234567', companyName: 'ABC Technology', status: 'CUSTOMER', source: 'REFERRAL' },
    { name: 'XYZ Solutions', email: 'info@xyz.com', phone: '0912345678', companyName: 'XYZ Solutions Ltd.', status: 'POTENTIAL', source: 'WEBSITE' },
    { name: 'Nguyễn Thành Nam', email: 'nam.nt@gmail.com', phone: '0987654321', status: 'NEW', source: 'ADVERTISING' },
    { name: 'Phúc Điền Corp', email: 'phucdien@corp.vn', phone: '0934567890', companyName: 'Phúc Điền Corporation', status: 'CUSTOMER', source: 'DIRECT' },
    { name: 'Green Energy JSC', email: 'hello@greenenergy.com', phone: '0956789012', companyName: 'Green Energy JSC', status: 'POTENTIAL', source: 'REFERRAL' },
    { name: 'Tech Startup Việt', email: 'startup@techviet.io', phone: '0923456789', companyName: 'Tech Startup Việt', status: 'NEW', source: 'WEBSITE' },
  ];
  const customers: any[] = [];
  for (const c of customerData) {
    const existing = await prisma.customer.findFirst({ where: { email: c.email } });
    if (!existing) {
      const customer = await prisma.customer.create({ data: { ...c, assignedTo: adminUser.id } });
      customers.push(customer);
    } else {
      customers.push(existing);
    }
  }

  // ── Tasks ──────────────────────────────────────────────
  const existingTaskCount = await prisma.task.count();
  if (existingTaskCount === 0) {
    const taskData = [
      { title: 'Thiết kế kiến trúc hệ thống mới', description: 'Xây dựng kiến trúc microservices cho hệ thống quản lý nội bộ', priority: 'HIGH', status: 'IN_PROGRESS', assignedTo: users[0].id, createdBy: adminUser.id, dueDate: new Date('2026-05-30') },
      { title: 'Phát triển module báo cáo doanh thu', description: 'Tạo dashboard và các biểu đồ thống kê theo tháng/quý/năm', priority: 'MEDIUM', status: 'TODO', assignedTo: users[2].id, createdBy: adminUser.id, dueDate: new Date('2026-06-15') },
      { title: 'Liên hệ khách hàng tiềm năng Q2', description: 'Gọi điện và gửi email chào hàng cho 20 khách hàng trong Q2', priority: 'URGENT', status: 'TODO', assignedTo: users[1].id, createdBy: adminUser.id, dueDate: new Date('2026-05-20') },
      { title: 'Triển khai chiến dịch Marketing tháng 5', description: 'Lên kế hoạch và triển khai chiến dịch quảng cáo trên mạng xã hội', priority: 'HIGH', status: 'IN_PROGRESS', assignedTo: users[4].id, createdBy: adminUser.id, dueDate: new Date('2026-05-25') },
      { title: 'Cập nhật chính sách nhân sự 2026', description: 'Review và cập nhật toàn bộ quy chế, chính sách nhân sự cho năm 2026', priority: 'MEDIUM', status: 'DONE', assignedTo: users[3].id, createdBy: adminUser.id, dueDate: new Date('2026-04-30') },
      { title: 'Fix lỗi performance trên Production', description: 'Điều tra và sửa các bottleneck hiệu suất trên server production', priority: 'URGENT', status: 'IN_PROGRESS', assignedTo: users[0].id, createdBy: adminUser.id, dueDate: new Date('2026-05-15') },
    ];
    await prisma.task.createMany({ data: taskData });
  }

  // ── Tickets ────────────────────────────────────────────
  // Ticket model: title, content (not description), customerId, assignedTo, createdBy, status, priority, resolvedAt
  const existingTicketCount = await prisma.ticket.count();
  if (existingTicketCount === 0) {
    const ticketData = [
      { title: 'Không thể đăng nhập vào hệ thống', content: 'Khách hàng báo lỗi khi đăng nhập, màn hình trắng sau khi nhập mật khẩu', priority: 'URGENT', status: 'OPEN', customerId: customers[0]?.id, createdBy: adminUser.id, assignedTo: users[0].id },
      { title: 'Yêu cầu tích hợp API thanh toán VNPAY', content: 'Khách hàng muốn tích hợp cổng thanh toán VNPAY vào hệ thống', priority: 'HIGH', status: 'IN_PROGRESS', customerId: customers[3]?.id, createdBy: adminUser.id, assignedTo: users[2].id },
      { title: 'Báo cáo số liệu tháng 4 bị sai', content: 'Số liệu doanh thu tháng 4 trên dashboard không khớp với dữ liệu thực tế', priority: 'HIGH', status: 'OPEN', customerId: customers[1]?.id, createdBy: adminUser.id },
      { title: 'Hướng dẫn sử dụng tính năng export Excel', content: 'Khách hàng cần được hỗ trợ cách xuất dữ liệu ra file Excel', priority: 'LOW', status: 'RESOLVED', customerId: customers[2]?.id, createdBy: adminUser.id, resolvedAt: new Date() },
      { title: 'Đề xuất thêm tính năng lọc theo ngày', content: 'Muốn thêm bộ lọc theo khoảng thời gian cho danh sách đơn hàng', priority: 'MEDIUM', status: 'OPEN', customerId: customers[4]?.id, createdBy: adminUser.id },
    ];
    await prisma.ticket.createMany({ data: ticketData });
  }

  // ── Activity Logs ──────────────────────────────────────
  const existingLogCount = await prisma.activityLog.count();
  if (existingLogCount === 0) {
    await prisma.activityLog.createMany({
      data: [
        { userId: adminUser.id, action: 'CREATE', module: 'departments', description: 'Tạo phòng ban Engineering' },
        { userId: users[0].id, action: 'UPDATE', module: 'tasks', description: 'Cập nhật trạng thái task "Fix lỗi performance"' },
        { userId: users[1].id, action: 'CREATE', module: 'customers', description: 'Thêm khách hàng mới XYZ Solutions' },
        { userId: adminUser.id, action: 'CREATE', module: 'employees', description: 'Thêm nhân viên Nguyễn Văn An vào hệ thống' },
        { userId: users[2].id, action: 'UPDATE', module: 'tickets', description: 'Tiếp nhận ticket tích hợp VNPAY' },
      ]
    });
  }

  // ── Attendance ──────────────────────────────────────────
  const existingAttendanceCount = await prisma.attendance.count();
  if (existingAttendanceCount === 0) {
    const attendanceData = [
      { userId: users[0].id, date: new Date('2026-05-11'), checkIn: new Date('2026-05-11T08:05:00'), checkOut: new Date('2026-05-11T17:15:00'), status: 'PRESENT', locationIn: 'Office', locationOut: 'Office' },
      { userId: users[1].id, date: new Date('2026-05-11'), checkIn: new Date('2026-05-11T08:35:00'), checkOut: new Date('2026-05-11T17:30:00'), status: 'LATE', locationIn: 'Office', locationOut: 'Office' },
      { userId: users[2].id, date: new Date('2026-05-11'), checkIn: new Date('2026-05-11T08:10:00'), checkOut: new Date('2026-05-11T16:45:00'), status: 'EARLY_LEAVE', locationIn: 'Office', locationOut: 'Office' },
      { userId: users[3].id, date: new Date('2026-05-11'), checkIn: new Date('2026-05-11T07:55:00'), checkOut: new Date('2026-05-11T17:05:00'), status: 'PRESENT', locationIn: 'Office', locationOut: 'Office' },
      { userId: adminUser.id, date: new Date(), checkIn: new Date(), status: 'PRESENT', locationIn: 'Office' }, // Admin check-in today!
    ];
    await prisma.attendance.createMany({ data: attendanceData });
  }

  // ── Leave Types ──────────────────────────────────────────────────────────────
  const leaveTypes = [
    { name: 'Nghỉ phép năm', description: 'Phép năm theo quy định lao động', maxDaysPerYear: 12, isPaid: true },
    { name: 'Nghỉ ốm', description: 'Nghỉ do bệnh, có chứng nhận y tế', maxDaysPerYear: 30, isPaid: true },
    { name: 'Nghỉ thai sản', description: 'Nghỉ thai sản theo quy định', maxDaysPerYear: 180, isPaid: true },
    { name: 'Nghỉ việc riêng', description: 'Nghỉ không hưởng lương cho việc cá nhân', maxDaysPerYear: 10, isPaid: false },
    { name: 'Nghỉ lễ bù', description: 'Nghỉ bù khi làm việc vào ngày lễ', maxDaysPerYear: 5, isPaid: true },
  ];
  const leaveTypeMap: Record<string, any> = {};
  for (const lt of leaveTypes) {
    const type = await prisma.leaveType.upsert({
      where: { name: lt.name },
      update: {},
      create: lt
    });
    leaveTypeMap[lt.name] = type;
  }

  // ── Sample Leave Requests ─────────────────────────────────────────────────────
  const existingLeaveCount = await prisma.leaveRequest.count();
  if (existingLeaveCount === 0 && users.length >= 3) {
    await prisma.leaveRequest.createMany({
      data: [
        {
          userId: users[0].id,
          leaveTypeId: leaveTypeMap['Nghỉ phép năm'].id,
          startDate: new Date('2026-06-02'),
          endDate: new Date('2026-06-06'),
          totalDays: 5,
          reason: 'Về quê thăm gia đình nhân dịp nghỉ hè',
          status: 'PENDING'
        },
        {
          userId: users[1].id,
          leaveTypeId: leaveTypeMap['Nghỉ ốm'].id,
          startDate: new Date('2026-05-20'),
          endDate: new Date('2026-05-21'),
          totalDays: 2,
          reason: 'Bị cúm, có giấy khám bệnh',
          status: 'APPROVED',
          approvedBy: adminUser.id,
          approvedAt: new Date('2026-05-19')
        },
        {
          userId: users[2].id,
          leaveTypeId: leaveTypeMap['Nghỉ việc riêng'].id,
          startDate: new Date('2026-05-28'),
          endDate: new Date('2026-05-28'),
          totalDays: 1,
          reason: 'Xử lý việc hành chính cá nhân',
          status: 'REJECTED',
          approvedBy: adminUser.id,
          approvedAt: new Date('2026-05-27'),
          note: 'Thời điểm cuối tháng, cần ở lại chốt báo cáo'
        },
      ]
    });
  }

  console.log('✅ Seed completed!');
  console.log(`   - 5 Departments`);
  console.log(`   - 5 Employees`);
  console.log(`   - 6 Customers`);
  console.log(`   - 6 Tasks`);
  console.log(`   - 5 Tickets`);
  console.log(`   - 5 Leave Types`);
  console.log(`   - 3 Leave Requests`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
