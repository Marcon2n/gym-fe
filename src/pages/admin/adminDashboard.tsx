import { useAuth } from "../../context/authContext";
import { Card } from "../../../components/ui/card";
import { Users, Package, TrendingUp, Heart } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();

  const stats = [
    {
      title: "Thành viên",
      value: "234",
      icon: <Users className="h-8 w-8 text-blue-500" />,
      color: "from-blue-50 to-blue-100",
    },
    {
      title: "Gói tập",
      value: "12",
      icon: <Package className="h-8 w-8 text-purple-500" />,
      color: "from-purple-50 to-purple-100",
    },
    {
      title: "Doanh thu tháng",
      value: "45M",
      icon: <TrendingUp className="h-8 w-8 text-green-500" />,
      color: "from-green-50 to-green-100",
    },
    {
      title: "Sức khỏe tổng thể",
      value: "98%",
      icon: <Heart className="h-8 w-8 text-red-500" />,
      color: "from-red-50 to-red-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Chào mừng {user?.name}, quản lý phòng tập của bạn từ đây
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            className={`bg-gradient-to-br ${stat.color} border-0 p-6 shadow-sm transition-all hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="mt-2 text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
              </div>
              {stat.icon}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              +2.5% from last month
            </p>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="col-span-2 p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Doanh thu 6 tháng
          </h3>
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">
              Chart data will be displayed here
            </p>
          </div>
        </Card>

        {/* Recent Activities */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Hoạt động gần đây
          </h3>
          <div className="space-y-3">
            {[
              "Thành viên mới: Nguyễn Văn A",
              "Gia hạn gói: Trần Thị B",
              "Thanh toán: 5M VND",
            ].map((activity, index) => (
              <div
                key={index}
                className="border-l-2 border-primary pl-3 py-2 text-sm text-muted-foreground"
              >
                {activity}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Members Overview */}
      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Danh sách thành viên mới
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Tên
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Số điện thoại
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Gói tập
                </th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: "Nguyễn Văn A",
                  phone: "0123456789",
                  package: "Premium",
                  status: "Active",
                },
                {
                  name: "Trần Thị B",
                  phone: "0987654321",
                  package: "Standard",
                  status: "Active",
                },
                {
                  name: "Phạm Văn C",
                  phone: "0912345678",
                  package: "Basic",
                  status: "Inactive",
                },
              ].map((member, index) => (
                <tr
                  key={index}
                  className="border-b border-border hover:bg-muted"
                >
                  <td className="px-4 py-3">{member.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {member.phone}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                      {member.package}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        member.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
