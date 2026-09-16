'use client';
import React, { useEffect, useState, useCallback } from "react";
import { getAllCandidateByRecruiter } from "../ApiService/action";
import { useParams } from "@/routing-shim";
import {
  Table,
  Card,
  Input,
  Space,
  Typography,
  Tag,
  Avatar,
  Layout,
  Button,
} from "antd";
import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import Header from "../Header/Header";

const { Content } = Layout;
const { Title, Text } = Typography;

const StyledContainer = ({ children, className, ...props }) => (
  <div
    className={className}
    style={{
      background: "linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)",
      minHeight: "100vh",
    }}
    {...props}
  >
    {children}
  </div>
);

const StyledCard = ({ children, className, ...props }) => (
  <Card
    className={className}
    styles={{ body: { padding: 0 } }}
    style={{
      margin: "24px auto",
      maxWidth: "1400px",
      borderRadius: "16px",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
      border: "none",
      overflow: "hidden",
    }}
    {...props}
  >
    {children}
  </Card>
);

const TableHeader = ({ children, className, ...props }) => (
  <div className={`table-header-custom ${className || ""}`} {...props}>
    {children}
  </div>
);

const SearchContainer = ({ children, className, ...props }) => (
  <div className={`search-container-custom ${className || ""}`} {...props}>
    {children}
  </div>
);

const StyledTable = (props) => (
  <Table className={`styled-table-custom ${props.className || ""}`} {...props} />
);

const UserAvatar = ({ className, ...props }) => (
  <Avatar
    className={className}
    style={{ backgroundColor: "#5f2eea", marginRight: "12px" }}
    {...props}
  />
);

export default function AllAppliedCandidates() {
  const [loginUserId, setLoginUserId] = useState(null);
  const { id } = useParams();
  const [appliedUsers, setAppliedUsers] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      title: "Candidate",
      render: (_, record) => (
        <Space>
          <UserAvatar icon={<UserOutlined />} />
          <div>
            <Text strong>
              {`${record.first_name || ""} ${record.last_name || ""}`.trim()}
            </Text>
            <br />
            <Text type="secondary">
              Applied Date:{" "}
              {record.created_at
                ? new Date(record.created_at).toLocaleDateString("en-GB")
                : "-"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Contact",
      render: (_, record) => (
        <div>
          <Text>{record.email}</Text>
          <br />
          <Text type="secondary">
            {record.phone_code} {record.phone || "No phone"}
          </Text>
        </div>
      ),
    },

    {
      title: "Applied For",
      render: (_, record) => (
        <div>
          <Text>{record.job_title}</Text>
        </div>
      ),
    },
    {
      title: "Status",
      render: () => <Tag color="green">Applied</Tag>,
    },
  ];

  useEffect(() => {
    const stored = localStorage.getItem("loginDetails");
    if (stored) {
      try {
        const loginDetails = JSON.parse(stored);
        if (loginDetails?.id) setLoginUserId(loginDetails.id);
      } catch (error) {
        console.error("Invalid JSON in localStorage", error);
      }
    }
  }, []);

  const getAllCandidateByRecruiterData = useCallback(async () => {
    try {
      setLoading(true);
      const payload = { user_id: loginUserId, id };
      const response = await getAllCandidateByRecruiter(payload);
      const allApplied = response?.data?.data || [];
      setAppliedUsers(allApplied);
      setFilteredData(allApplied);
    } catch (error) {
      console.error("Error fetching candidates", error);
    } finally {
      setLoading(false);
    }
  }, [loginUserId, id]);

  useEffect(() => {
    if (loginUserId) {
      getAllCandidateByRecruiterData();
    }
  }, [loginUserId, getAllCandidateByRecruiterData]);

  // Filter logic
  useEffect(() => {
    if (!searchText) {
      setFilteredData(appliedUsers);
    } else {
      const lowerSearch = searchText.toLowerCase();
      const filtered = appliedUsers.filter(
        (item) =>
          `${item.first_name || ""} ${item.last_name || ""}`
            .toLowerCase()
            .includes(lowerSearch) ||
          (item.email || "").toLowerCase().includes(lowerSearch) ||
          (item.phone || "").toLowerCase().includes(lowerSearch) ||
          (item.job_title || "").toLowerCase().includes(lowerSearch)
      );
      setFilteredData(filtered);
    }
  }, [searchText, appliedUsers]);

  return (
    <>
      <style>{`
        .table-header-custom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          background: #fff;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        @media (max-width: 768px) {
          .table-header-custom {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }

        .search-container-custom {
          width: 100%;
          max-width: 500px;
        }

        .search-container-custom .ant-input-affix-wrapper {
          border-radius: 8px;
          padding: 10px 16px;
          border: 1px solid #e0e0e0;
          transition: all 0.3s;
        }

        .search-container-custom .ant-input-affix-wrapper:hover,
        .search-container-custom .ant-input-affix-wrapper:focus {
          border-color: #5f2eea;
          box-shadow: 0 0 0 2px rgba(143, 24, 255, 0.05);
        }

        .styled-table-custom .ant-table {
          border-radius: 0 0 12px 12px;
          overflow: hidden;
        }

        .styled-table-custom .ant-table-thead > tr > th {
          background: #f8fafc;
          font-weight: 600;
          color: #64748b;
          border-bottom: 1px solid #e2e8f0;
        }

        .styled-table-custom .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
          transition: all 0.2s;
        }

        .styled-table-custom .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }

        .styled-table-custom .ant-pagination-item-active {
          border-color: #5f2eea;
          background: #5f2eea;
        }

        .styled-table-custom .ant-pagination-item-active a {
          color: white !important;
        }
      `}</style>
      <StyledContainer>
      <Layout>
        <Header />
        <Content>
          <StyledCard>
            <TableHeader>
              <Title level={4} style={{ margin: 0 }}>
                Applied Candidates
                <Text
                  type="secondary"
                  style={{
                    display: "block",
                    fontWeight: "normal",
                    fontSize: 14,
                  }}
                >
                  {filteredData.length} candidates found
                </Text>
              </Title>
              <SearchContainer>
                <Input
                  placeholder="Search candidates by name, email, phone, or job title"
                  prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </SearchContainer>
            </TableHeader>
            <StyledTable
              columns={columns}
              dataSource={filteredData}
              rowKey={(record, index) =>
                `${record.id || record.email}-${index}`
              }
              pagination={{
                pageSize: 8,
                showSizeChanger: false,
                showTotal: (total) => `Total ${total} candidates`,
              }}
              loading={loading}
              scroll={{ x: true }}
            />
          </StyledCard>
        </Content>
      </Layout>
    </StyledContainer>
    </>
  );
}


