"use client";

import { Card, CardBody } from "@heroui/react";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";

export default function AnalyticsPage() {
  const stats = [
    {
      title: "Total Revenue",
      value: "¥1,234,567",
      icon: DollarSign,
      color: "text-success",
    },
    {
      title: "Active Users",
      value: "1,234",
      icon: Users,
      color: "text-primary",
    },
    {
      title: "Growth",
      value: "+12.5%",
      icon: TrendingUp,
      color: "text-secondary",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BarChart3 className="text-primary" size={32} />
          Analytics Dashboard
        </h1>
        <p className="text-default-500">
          Overview of your store performance (Placeholder).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-none shadow-md">
            <CardBody className="flex flex-row items-center gap-4 p-6">
              <div className={`p-3 rounded-xl bg-default-100 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-default-500">
                  {stat.title}
                </p>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="h-[400px] flex items-center justify-center border-dashed border-2 border-divider shadow-none bg-transparent">
        <div className="text-center text-default-400">
          <BarChart3 className="mx-auto mb-4 opacity-20" size={48} />
          <h3 className="text-lg font-semibold">
            Chart Configuration Required
          </h3>
          <p>Connect your data source to visualize trends.</p>
        </div>
      </Card>
    </div>
  );
}
