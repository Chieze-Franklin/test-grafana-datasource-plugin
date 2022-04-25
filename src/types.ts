import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface MyQuery extends DataQuery {
  queryText?: string;
  projectId: string;
}

export const defaultQuery: Partial<MyQuery> = {
  // projectId: "dc653b95-a3e1-4fd3-a106-018eafb41266",
};

export type MetricOwnerType = 'agent' | 'aggregator' | 'pipeline' | 'project';

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  metricOwnerId: string;
  metricOwnerType: MetricOwnerType;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  accessToken: string;
}
