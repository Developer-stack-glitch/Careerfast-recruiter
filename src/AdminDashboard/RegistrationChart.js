'use client';
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Sector,
  BarChart,
  Bar,
} from "recharts";
import {
  DatePicker,
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Skeleton,
  Alert,
  Select,
  Space,
} from "antd";
import {
  RiseOutlined,
  FallOutlined,
  TeamOutlined,
  BarChartOutlined,
  UserOutlined,
  DashboardOutlined,
  CalendarOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import { getAppliedCandidatesCount, StatsOfPost } from "../ApiService/action";
import { useParams } from "@/routing-shim";

const { Title, Text } = Typography;
const { Option } = Select;

/* Global styles moved to inline style block below */

/* Functional component wrappers */
const DashboardContainer = ({ children, className, ...props }) => (
  <div
    className={className}
    style={{
      padding: "24px",
      background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
      minHeight: "100vh",
    }}
    {...props}
  >
    {children}
  </div>
);

const HeaderSection = ({ children, ...props }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
      flexWrap: "wrap",
      gap: "16px",
    }}
    {...props}
  >
    {children}
  </div>
);

const ChartCard = ({ children, ...props }) => (
  <Card
    styles={{
      header: { borderBottom: "1px solid rgba(0, 0, 0, 0.05)", padding: "16px 24px" },
      body: { padding: "24px" },
    }}
    style={{
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
      marginBottom: "24px",
      border: "none",
      overflow: "hidden",
      background: "#ffffff",
    }}
    {...props}
  >
    {children}
  </Card>
);

const StatCard = ({ children, ...props }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <Card
      style={{
        borderRadius: "16px",
        boxShadow: hover ? "0 8px 25px rgba(0, 0, 0, 0.08)" : "0 4px 12px rgba(0, 0, 0, 0.03)",
        border: "none",
        background: "linear-gradient(135deg, #ffffff 0%, #fcfcfc 100%)",
        transition: "all 0.3s ease",
        transform: hover ? "translateY(-4px)" : "none",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...props}
    >
      <div className="stat-card-custom-styles">
        {children}
      </div>
    </Card>
  );
};

const COLORS = ["#8B5CF6", "#10B981", "#EC4899", "#F59E0B", "#6366F1"];
const CHART_COLORS = {
  total: "#6366F1",
  male: "#10B981",
  female: "#EC4899",
};

const RegistrationDashboard = () => {
  const { id } = useParams();
  const [loginUserId, setLoginUserId] = useState(null);

  /* initialize to 0 to avoid NaN arithmetic issues */
  const [maleCount, setMaleCount] = useState(0);
  const [femaleCount, setFemaleCount] = useState(0);
  const [othersCount, setOthersCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [impressions, setImpressions] = useState(0);
  const [ctr, setCtr] = useState(null);
  const [selectedMetric, setSelectedMetric] = useState("total");

  const [domainCount, setDomainCount] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePieIndex, setActivePieIndex] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("loginDetails");
      if (stored) {
        const loginDetails = JSON.parse(stored);
        setLoginUserId(loginDetails.id);
      }
    } catch (error) {
      console.error("Invalid JSON in localStorage", error);
    }
  }, []);

  /* re-run when loginUserId OR selected post id changes */
  useEffect(() => {
    if (loginUserId && id) {
      setLoading(true);
      Promise.all([StatsOfPostData(loginUserId, id), getAppliedCandidatesCountData(loginUserId, id)])
        .catch((e) => console.error(e))
        .finally(() => {
          // ensure a small delay for smoothing skeleton-to-content transition
          setTimeout(() => setLoading(false), 200);
        });
    }
  }, [loginUserId, id]);

  const StatsOfPostData = useCallback(async (userId, postId) => {
    const payload = {
      user_id: userId,
      job_post_id: postId,
    };
    try {
      const response = await StatsOfPost(payload);
      const data = response?.data?.data || {};

      const males = Number(data.males || 0);
      const females = Number(data.females || 0);
      const others = Number(data.others || 0);
      const count = Number(data.candidatesCount || 0);

      setMaleCount(males);
      setFemaleCount(females);
      setOthersCount(others);
      setTotalCount(count);

      /* try to detect impressions/views to calculate CTR */
      const imp = Number(data.impressions ?? data.views ?? 0);
      setImpressions(imp);

      if (imp > 0) {
        setCtr((count / imp) * 100);
      } else {
        setCtr(null); // unknown
      }
    } catch (error) {
      console.log("StatsOfPost error", error);
      setMaleCount(0);
      setFemaleCount(0);
      setOthersCount(0);
      setTotalCount(0);
      setImpressions(0);
      setCtr(null);
    }
  }, []);

  const getAppliedCandidatesCountData = useCallback(async (userId, postId) => {
    const payload = {
      user_id: userId,
      id: postId,
    };
    try {
      const response = await getAppliedCandidatesCount(payload);
      const stats = response?.data?.data?.domain_stats || [];

      const domainMap = {};
      stats.forEach((item) => {
        const key = item.job_categories || item.category || "Unknown";
        domainMap[key] = (domainMap[key] || 0) + Number(item.candidates_count || 0);
      });

      const formatted = Object.keys(domainMap).map((key) => ({
        name: key,
        count: domainMap[key],
      }));

      // Sort by candidate count descending
      formatted.sort((a, b) => b.count - a.count);

      setDomainCount(formatted);
    } catch (error) {
      console.log("getAppliedCandidatesCount error", error);
      setDomainCount([]);
    }
  }, []);

  /* time series mock — make sure we guard with (maleCount || 0) etc. */
  const timeSeriesData = useMemo(() => {
    const m = maleCount || 0;
    const f = femaleCount || 0;
    const o = othersCount || 0;
    const t = totalCount || 0;

    return [
      { date: "06-25", total: t, male: m, female: f },
      { date: "06-26", total: t + 2, male: (m + 1), female: (f + 1) },
      { date: "06-27", total: t + 5, male: (m + 3), female: (f + 2) },
      { date: "06-28", total: t + 7, male: (m + 4), female: (f + 3) },
      { date: "06-29", total: t + 10, male: (m + 6), female: (f + 4) },
      { date: "06-30", total: t + 15, male: (m + 9), female: (f + 6) },
    ];
  }, [maleCount, femaleCount, othersCount, totalCount]);

  const genderData = useMemo(() => [
    { name: "Female", value: femaleCount || 0 },
    { name: "Male", value: maleCount || 0 },
    { name: "Other", value: othersCount || 0 },
  ], [maleCount, femaleCount, othersCount]);

  const totalRegistrations = genderData.reduce((acc, cur) => acc + Number(cur.value || 0), 0);

  const lastValue = timeSeriesData[timeSeriesData.length - 1]?.total || 0;
  const prevValue = timeSeriesData[timeSeriesData.length - 2]?.total || 0;
  let growthRate = 0;
  if (prevValue === 0 && lastValue > 0) {
    growthRate = 100;
  } else {
    growthRate = ((lastValue - prevValue) / (prevValue || 1)) * 100;
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const isDomain = payload[0]?.name === "Candidates";
      return (
        <div className="custom-tooltip">
          <p className="label">{isDomain ? `Domain: ${label}` : `Date: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
      cx,
      cy,
      midAngle,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload,
      percent,
      value,
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontWeight="600">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#334155" fontWeight="600">
          {`${value} candidates`}
        </text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          dy={18}
          textAnchor={textAnchor}
          fill="#64748B"
        >
          {`(${(percent * 100).toFixed(0)}%)`}
        </text>
      </g>
    );
  };

  /* pie hover handler */
  const onPieEnter = (_, index) => {
    setActivePieIndex(index);
  };

  return (
    <>
      <style>{`
        .premium-dashboard {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        }
        
        .custom-tooltip {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .ant-select-dropdown{
          width: 90px !important;
        }
        
        .custom-tooltip p {
          margin: 5px 0;
          color: #1E293B;
          font-weight: 500;
        }
        
        .custom-tooltip .label {
          color: #64748B;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-card-custom-styles .ant-statistic-title {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
        }
        
        .stat-card-custom-styles .ant-statistic-content {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
        }
      `}</style>
      <DashboardContainer className="premium-dashboard">
        <HeaderSection>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1E293B', fontWeight: 700 }}>
              Registration Analytics
            </Title>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Detailed insights for your selected job post
            </Text>
          </div>
          <Space>
            <DatePicker size="large" />
          </Space>
        </HeaderSection>

        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={8}>
            <StatCard>
              {loading ? (
                <Skeleton active />
              ) : (
                <Statistic
                  title="Total Registrations"
                  value={totalCount}
                  prefix={<TeamOutlined style={{ color: '#6366F1' }} />}
                  valueStyle={{ color: '#6366F1' }}
                />
              )}
            </StatCard>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <StatCard>
              {loading ? (
                <Skeleton active />
              ) : (
                <Statistic
                  title="Daily Average"
                  value={((totalCount || 0) / (timeSeriesData.length || 1)).toFixed(1)}
                  prefix={<BarChartOutlined style={{ color: '#10B981' }} />}
                  valueStyle={{ color: '#10B981' }}
                />
              )}
            </StatCard>
          </Col>


          <Col xs={24} sm={12} lg={8}>
            <StatCard>
              {loading ? (
                <Skeleton active />
              ) : (
                <Statistic
                  title="Growth Rate"
                  value={growthRate.toFixed(1)}
                  suffix="%"
                  prefix={growthRate >= 0 ?
                    <RiseOutlined style={{ color: '#10B981' }} /> :
                    <FallOutlined style={{ color: '#EF4444' }} />
                  }
                  valueStyle={{ color: growthRate >= 0 ? "#10B981" : "#EF4444" }}
                />
              )}
            </StatCard>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            <ChartCard
              title={
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                    <DashboardOutlined style={{ marginRight: 8, color: '#6366F1' }} />
                    Registration Trends
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                    Monthly registration metrics and trend analysis
                  </Text>
                </div>
              }
              extra={
                <Select
                  value={selectedMetric}
                  onChange={setSelectedMetric}
                  size="small"
                  variant="borderless"
                >
                  <Option value="total">Total</Option>
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                </Select>
              }
            >
              {loading ? (
                <Skeleton active />
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ paddingTop: 20 }} />

                    {/* Show all three when "total" is selected */}
                    {(selectedMetric === "total" || selectedMetric === "male") && (
                      <Line
                        type="monotone"
                        dataKey="male"
                        stroke={CHART_COLORS.male}
                        strokeWidth={3}
                        name="Male"
                        dot={{ r: 4, fill: CHART_COLORS.male, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: CHART_COLORS.male, stroke: '#fff', strokeWidth: 2 }}
                      />
                    )}

                    {(selectedMetric === "total" || selectedMetric === "female") && (
                      <Line
                        type="monotone"
                        dataKey="female"
                        stroke={CHART_COLORS.female}
                        strokeWidth={3}
                        name="Female"
                        dot={{ r: 4, fill: CHART_COLORS.female, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: CHART_COLORS.female, stroke: '#fff', strokeWidth: 2 }}
                      />
                    )}

                    {selectedMetric === "total" && (
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke={CHART_COLORS.total}
                        strokeWidth={3}
                        name="Total"
                        dot={{ r: 4, fill: CHART_COLORS.total, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, fill: CHART_COLORS.total, stroke: '#fff', strokeWidth: 2 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </Col>

          <Col xs={24} lg={10}>
            <ChartCard
              title={
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <Title level={5} style={{ margin: 0, fontWeight: 700 }}>
                    <UserOutlined style={{ marginRight: 8, color: '#8B5CF6' }} />
                    Gender Distribution
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                    Gender distribution for the selected job post
                  </Text>
                </div>
              }
            >

              {genderData.some((item) => item.value > 0) ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape}
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      dataKey="value"
                      onMouseEnter={onPieEnter}
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    {/* 👇 Add legend here */}
                    <Legend
                      iconType="circle"
                      iconSize={10}
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ paddingTop: 20 }}
                    />
                  </PieChart>
                </ResponsiveContainer>

              ) : (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <Title level={4} style={{ color: "#cbd5e1" }}>No gender data available</Title>
                </div>
              )}
            </ChartCard>
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          <Col xs={24}>
            <ChartCard
              title={
                <Space>
                  <PieChartOutlined style={{ color: '#F59E0B' }} />
                  <Title level={5} style={{ margin: 0 }}>Domain Distribution</Title>
                </Space>
              }
            >
              {domainCount.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={domainCount} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      tickLine={false}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                      height={70}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{ paddingTop: 10 }}
                    />
                    <Bar
                      dataKey="count"
                      name="Candidates"
                      fill="#8B5CF6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <Title level={4} style={{ color: "#cbd5e1" }}>No domain data available</Title>
                </div>
              )}
            </ChartCard>
          </Col>
        </Row>
      </DashboardContainer>
    </>
  );
};

export default RegistrationDashboard;


