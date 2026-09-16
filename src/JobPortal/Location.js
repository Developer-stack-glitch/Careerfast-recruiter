'use client';
import React, { useEffect, useState } from "react";
import { Typography, Button, Divider, List, Input, Checkbox } from "antd";
import { EnvironmentOutlined, SearchOutlined } from "@ant-design/icons";
import "../css/JobFilter.css";

import { State, City } from "country-state-city";

const { Text } = Typography;

export default function Location() {
  const [search, setSearch] = useState("");
  const [tempSelected, setTempSelected] = useState([]);

  const [workLocationOption, setWorkLocationOption] = useState([]);

  useEffect(() => {
    const loadCities = () => {
      const states = State.getStatesOfCountry("IN");
      const cities = states.flatMap((state) =>
        City.getCitiesOfState("IN", state.isoCode)
      );
      const formatted = cities.map((city) => ({
        label: city.name,
        value: city.name,
      }));
      setWorkLocationOption(formatted);
    };

    loadCities();
  }, []);

  const handleTempLocationCheck = (value) => {
    setTempSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleLocationClear = () => {
    setTempSelected([]);
    setSearch("");
  };

  const applyLocationFilter = () => {
    console.log("Selected:", tempSelected);
  };

  return (
    <div style={{ width: 300, padding: 16, background: "#fff" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <Text strong>Location</Text>
        <Button type="link" size="small" danger onClick={handleLocationClear}>
          Clear
        </Button>
      </div>

      <Input
        placeholder="Search location"
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      <List
        dataSource={workLocationOption.filter((item) =>
          item.label.toLowerCase().includes(search.toLowerCase())
        )}
        style={{ maxHeight: 200, overflowY: "auto" }}
        renderItem={(item) => (
          <List.Item style={{ padding: "4px 0" }} key={item.value}>
            <Checkbox
              checked={tempSelected.includes(item.value)}
              onChange={() => handleTempLocationCheck(item.value)}
            >
              <Text>
                <EnvironmentOutlined style={{ marginRight: 6 }} />
                {item.label}
              </Text>
            </Checkbox>
          </List.Item>
        )}
      />

      <Divider style={{ margin: "12px 0" }} />

      <div style={{ textAlign: "right" }}>
        <Button
          type="primary"
          onClick={applyLocationFilter}
          className="apply_filter"
          shape="round"
        >
          Apply Filter →
        </Button>
      </div>
    </div>
  );
}

