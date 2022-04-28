import { DataQuery, DataSourceJsonData, MutableDataFrame } from '@grafana/data';

export interface MyQuery extends DataQuery {
  agent?: string;
  aggregator?: string;
  pipeline?: string;
  metric?: string;
  metricType?: MetricType;
  project?: string;
  plugin?: string;

  // ----- query params ------
  duration: number; // duration in hours
  interval: number; // interval in hours

  // ----- query result ------
  frame?: MutableDataFrame<any>;
}

export const defaultQuery: Partial<MyQuery> = {
  duration: 24 * 7, // 7 days
  interval: 1, // 1 hour
};

export type MetricType = 'agent' | 'aggregator' | 'pipeline' | 'project';

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {}
