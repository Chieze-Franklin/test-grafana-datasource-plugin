import { DataQuery, DataSourceJsonData, MutableDataFrame } from '@grafana/data';

export interface MyQuery extends DataQuery {
  agent?: string;
  aggregator?: string;
  pipeline?: string;
  metric?: string;
  metricType?: MetricType;
  project?: string;
  plugin?: string;

  // ----- query result ------
  frame?: MutableDataFrame<any>;
}

export const defaultQuery: Partial<MyQuery> = {};

export type MetricType = 'agent' | 'aggregator' | 'pipeline' | 'project_pipeline' | 'project';

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  accessToken: string;
}
