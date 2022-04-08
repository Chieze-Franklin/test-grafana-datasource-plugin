import defaults from 'lodash/defaults';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';

import { MyQuery, MyDataSourceOptions, defaultQuery } from './types';
import { sampleProjectData } from 'utils';
import { ProjectMetrics } from 'metrics/types';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  metricOwnerType: string;
  metricOwnerId: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);

    this.metricOwnerType = instanceSettings.jsonData.metricOwnerType;
    this.metricOwnerId = instanceSettings.jsonData.metricOwnerId;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const promises = options.targets.map((target) => {
      const query = defaults(target, defaultQuery);
      this.doRequest(
        `https://cloud-api.calyptia.com/v1/${this.metricOwnerType}s/${this.metricOwnerId}/metrics?start=-72h&interval=1h`,
        query
      ).then((response) => {
        console.log('>>>>>>>>>>>>>>>>>>>>>>');
        // @ts-ignore
        console.log(response);
        const frame = new MutableDataFrame({
          refId: query.refId,
          fields: [
            { name: 'time', type: FieldType.time },
            { name: 'value', type: FieldType.number },
            { name: 'metric', type: FieldType.string },
          ],
        });

        const data: ProjectMetrics = sampleProjectData(); // = response.data;
        Object.keys(data.measurements).forEach((measurementsKey: string) => {
          const plugins = data.measurements[measurementsKey].plugins;
          Object.keys(plugins).forEach((pluginsKey: string) => {
            const metrics = plugins[pluginsKey].metrics;
            Object.keys(metrics).forEach((metricsKey: string) => {
              metrics[metricsKey].forEach((metric) => {
                // frame.appendRow([Date.parse(metric.time), metric.value, `${pluginsKey}.${metricsKey}`]);
                frame.add({
                  time: Date.parse(metric.time),
                  value: metric.value,
                  metric: `${pluginsKey}.${metricsKey}`,
                });
              });
            });
          });
        });

        return frame;
      });
    });

    return Promise.all(promises).then((data) => ({ data }));

    // =============

    // const data = options.targets.map((target) => {
    //   const query = defaults(target, defaultQuery);

    //   const frame = new MutableDataFrame({
    //     refId: query.refId,
    //     fields: [
    //       { name: 'time', type: FieldType.time },
    //       { name: 'value', type: FieldType.number },
    //       { name: 'metric', type: FieldType.string },
    //     ],
    //   });

    //   const data: ProjectMetrics = sampleProjectData(); // = response.data;
    //   Object.keys(data.measurements).forEach((measurementsKey: string) => {
    //     const plugins = data.measurements[measurementsKey].plugins;
    //     Object.keys(plugins).forEach((pluginsKey: string) => {
    //       const metrics = plugins[pluginsKey].metrics;
    //       Object.keys(metrics).forEach((metricsKey: string) => {
    //         metrics[metricsKey].forEach((metric) => {
    //           // frame.appendRow([Date.parse(metric.time), metric.value, `${pluginsKey}.${metricsKey}`]);
    //           frame.add({ time: Date.parse(metric.time), value: metric.value, metric: `${pluginsKey}.${metricsKey}` });
    //         });
    //       });
    //     });
    //   });

    //   return frame;
    // });

    // return { data };
  }

  async testDatasource() {
    // Implement a health check for your data source.
    return {
      status: 'success',
      message: 'Success',
    };
  }

  async doRequest(url: string, query: MyQuery) {
    console.log(url);
    console.log(query);
    const result = await getBackendSrv().datasourceRequest({
      method: 'GET',
      url,
      // params: query,
      headers: {
        Accept: 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImxHRUpobXVFU1BYbFBocDNCdWI5dyJ9.eyJodHRwczovL2Nsb3VkLmNhbHlwdGlhLmNvbS9lbWFpbCI6ImZyYW5rbGluQGNhbHlwdGlhLmNvbSIsImh0dHBzOi8vY2xvdWQuY2FseXB0aWEuY29tL2VtYWlsX3ZlcmlmaWVkIjp0cnVlLCJodHRwczovL2Nsb3VkLmNhbHlwdGlhLmNvbS9mYW1pbHlfbmFtZSI6IkNoaWV6ZSIsImh0dHBzOi8vY2xvdWQuY2FseXB0aWEuY29tL2dpdmVuX25hbWUiOiJGcmFua2xpbiAiLCJodHRwczovL2Nsb3VkLmNhbHlwdGlhLmNvbS9uYW1lIjoiRnJhbmtsaW4gQ2hpZXplIiwiaHR0cHM6Ly9jbG91ZC5jYWx5cHRpYS5jb20vbmlja25hbWUiOiJmcmFua2xpbiIsImh0dHBzOi8vY2xvdWQuY2FseXB0aWEuY29tL3BpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS0vQU9oMTRHaUwzLVRGUnQ2RG8zMVlnNXlJc1hXdzJ4cTJXVEVEb3BsMTduajc9czk2LWMiLCJpc3MiOiJodHRwczovL3Nzby5jYWx5cHRpYS5jb20vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMDM2OTk4OTQ1MTI5OTE3MjY1OTQiLCJhdWQiOlsiaHR0cHM6Ly9jb25maWcuY2FseXB0aWEuY29tIiwiaHR0cHM6Ly9kZXYtMTVzbWpoLWUudXMuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTY0OTE5NjI0MSwiZXhwIjoxNjQ5NzU2MjQxLCJhenAiOiJoT0R0dkMzb09RVndUOElMeG9RRnY1ZVJ0Z0Vsc2RGaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MifQ.Kx5-A1x5f-c4UZhxkXclXAYO_xpc8VpG1l84IDyFS2dLibYbNp5nq0XKDAGeiAu4CEPCKAyG6-guzQZcg6TKr8Plt7lMOmVjMx8XMtpudXzNBxY1omNhIMDdPtuDs-umm0nneV81yJo444GrKpKeyHcwrq1uwHdXybIyM4cHm-WGGc1CKYjUhdmtV4J89ou4SJE2DBm1ZG1WHoOmJwg6uQetwPtCpQ0cUtJxWHVZ8OnDaNHLIi3cJjSLbOay8r69fW3gW3Mrv4o-oasoZJH6LzY6-j30DEsHJ7ZqVS99AYV6UuXqYlGSLNIGQD20KmbimxknpvqhYminDKU7qc7Cag',
      },
    });

    console.log(result);

    return result;
  }
}
