import React from "react";
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { Card, Typography } from "@mui/material";
import { lang } from "../lang";

export default function AdminDashboard({ language }) {
  const data = [
    {
      id: 'Mon',
      data: [
        { x: '0:00', y: 12 }, { x: '1:00', y: 30 }, { x: '2:00', y: 45 },
        { x: '3:00', y: 32 }, { x: '4:00', y: 10 }, { x: '5:00', y: 50 },
        { x: '6:00', y: 45 }, { x: '7:00', y: 28 }, { x: '8:00', y: 18 },
        { x: '9:00', y: 36 }, { x: '10:00', y: 40 }, { x: '11:00', y: 22 }
      ]
    },
    {
      id: 'Tue',
      data: [
        { x: '0:00', y: 12 }, { x: '1:00', y: 30 }, { x: '2:00', y: 45 },
        { x: '3:00', y: 32 }, { x: '4:00', y: 10 }, { x: '5:00', y: 50 },
        { x: '6:00', y: 45 }, { x: '7:00', y: 28 }, { x: '8:00', y: 18 },
        { x: '9:00', y: 36 }, { x: '10:00', y: 40 }, { x: '11:00', y: 22 }
      ]
    },
    {
      id: 'Wed',
      data: [
        { x: '0:00', y: 12 }, { x: '1:00', y: 30 }, { x: '2:00', y: 45 },
        { x: '3:00', y: 32 }, { x: '4:00', y: 10 }, { x: '5:00', y: 50 },
        { x: '6:00', y: 45 }, { x: '7:00', y: 28 }, { x: '8:00', y: 18 },
        { x: '9:00', y: 36 }, { x: '10:00', y: 40 }, { x: '11:00', y: 22 }
      ]
    },
    {
      id: 'Thu',
      data: [
        { x: '0:00', y: 12 }, { x: '1:00', y: 30 }, { x: '2:00', y: 45 },
        { x: '3:00', y: 32 }, { x: '4:00', y: 10 }, { x: '5:00', y: 50 },
        { x: '6:00', y: 45 }, { x: '7:00', y: 28 }, { x: '8:00', y: 18 },
        { x: '9:00', y: 36 }, { x: '10:00', y: 40 }, { x: '11:00', y: 22 }
      ]
    },
    {
      id: 'Fri',
      data: [
        { x: '0:00', y: 12 }, { x: '1:00', y: 30 }, { x: '2:00', y: 45 },
        { x: '3:00', y: 32 }, { x: '4:00', y: 10 }, { x: '5:00', y: 50 },
        { x: '6:00', y: 45 }, { x: '7:00', y: 28 }, { x: '8:00', y: 18 },
        { x: '9:00', y: 36 }, { x: '10:00', y: 40 }, { x: '11:00', y: 22 }
      ]
    },
    {
      id: 'Sat',
      data: [
        { x: '0:00', y: 12 }, { x: '1:00', y: 30 }, { x: '2:00', y: 45 },
        { x: '3:00', y: 32 }, { x: '4:00', y: 10 }, { x: '5:00', y: 50 },
        { x: '6:00', y: 45 }, { x: '7:00', y: 28 }, { x: '8:00', y: 18 },
        { x: '9:00', y: 36 }, { x: '10:00', y: 40 }, { x: '11:00', y: 22 }
      ]
    },
    {
      id: 'Sun',
      data: [
        { x: '0:00', y: 12 }, { x: '1:00', y: 30 }, { x: '2:00', y: 45 },
        { x: '3:00', y: 32 }, { x: '4:00', y: 10 }, { x: '5:00', y: 50 },
        { x: '6:00', y: 45 }, { x: '7:00', y: 28 }, { x: '8:00', y: 18 },
        { x: '9:00', y: 36 }, { x: '10:00', y: 40 }, { x: '11:00', y: 22 }
      ]
    }
  ];

  return (
    <div className="p-6 h-[600px] bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100">
      <Card className="p-6 h-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <Typography variant="h6" gutterBottom>
          📊 {lang("tenantUsageHeatmap", language)}
        </Typography>
        <div style={{ height: 500 }}>
          <ResponsiveHeatMap
            data={data}
            keys={['0:00','1:00','2:00','3:00','4:00','5:00','6:00','7:00','8:00','9:00','10:00','11:00']}
            indexBy="id"
            margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
            axisTop={{ tickSize: 5, tickPadding: 5, tickRotation: -45 }}
            axisLeft={{ tickSize: 5, tickPadding: 5 }}
            cellOpacity={1}
            cellBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
            labelTextColor={{ from: 'color', modifiers: [['darker', 1.8]] }}
            defs={[]}
            fill={[]}
            animate={true}
            motionConfig="gentle"
            hoverTarget="cell"
            cellHoverOthersOpacity={0.25}
          />
        </div>
      </Card>
    </div> 
  );
}