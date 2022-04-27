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
// import { sampleProjectData } from 'utils';
import { ProjectMetrics } from 'metrics/types';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  metricOwnerType: string;
  metricOwnerId: string;
  url?: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);

    this.metricOwnerType = instanceSettings.jsonData.metricOwnerType;
    this.metricOwnerId = instanceSettings.jsonData.metricOwnerId;
    this.url = instanceSettings.url;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const promises = options.targets.map(async (target) => {
      const query = defaults(target, defaultQuery);
      return this.doRequest(
        `${this.url}/calyptia/v1/${this.metricOwnerType}s/${this.metricOwnerId}/metrics?start=-72h&interval=1h`,
        query
      )
        .then((response) => {
          console.log('>>>>>>>>>>>>>>>>>>>>>>response in query');
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

          // @ts-ignore
          const data: ProjectMetrics = response.data; // sampleProjectData();
          console.log('>>>>>>>>>>>>>>>>>>>>>>data in query');
          console.log(data);
          Object.keys(data.measurements).forEach((measurementsKey: string) => {
            const plugins = data.measurements[measurementsKey].plugins;
            Object.keys(plugins).forEach((pluginsKey: string) => {
              const metrics = plugins[pluginsKey].metrics;
              Object.keys(metrics).forEach((metricsKey: string) => {
                metrics[metricsKey].forEach((metric) => {
                  if (!metric.value) {
                    return;
                  } // TODO: should we allow null values?
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

          console.log('>>>>>>>>>>>>>>>>>>>>>>frame in query');
          console.log(frame);

          return frame;
        })
        .catch((e) => {
          console.log('>>>>>>>>>>>>>>>>>>>>>>error in query');
          console.log(e);
        });
    });

    return Promise.all(promises).then((data) => {
      console.log('>>>>>>>>>>>>>>>>>>>>>>data in Promise.all');
      console.log(data);
      return { data };
    });
  }

  async testDatasource() {
    // Implement a health check for your data source.
    return {
      status: 'success',
      message: 'Success',
    };
  }

  async doRequest(url: string, query: MyQuery) {
    console.log('>>>>>>>>>>>>>>>>>>>>>>url in dorequest');
    console.log(url);
    console.log('>>>>>>>>>>>>>>>>>>>>>>query in dorequest');
    console.log(query);
    const result = await getBackendSrv()
      .datasourceRequest({
        method: 'GET',
        url,
        // params: query,
        headers: {
          Accept: 'application/json',
          Authorization:
            'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImxHRUpobXVFU1BYbFBocDNCdWI5dyJ9.eyJodHRwczovL2Nsb3VkLmNhbHlwdGlhLmNvbS9lbWFpbCI6ImZyYW5rbGluQGNhbHlwdGlhLmNvbSIsImh0dHBzOi8vY2xvdWQuY2FseXB0aWEuY29tL2VtYWlsX3ZlcmlmaWVkIjp0cnVlLCJodHRwczovL2Nsb3VkLmNhbHlwdGlhLmNvbS9mYW1pbHlfbmFtZSI6IkNoaWV6ZSIsImh0dHBzOi8vY2xvdWQuY2FseXB0aWEuY29tL2dpdmVuX25hbWUiOiJGcmFua2xpbiAiLCJodHRwczovL2Nsb3VkLmNhbHlwdGlhLmNvbS9uYW1lIjoiRnJhbmtsaW4gQ2hpZXplIiwiaHR0cHM6Ly9jbG91ZC5jYWx5cHRpYS5jb20vbmlja25hbWUiOiJmcmFua2xpbiIsImh0dHBzOi8vY2xvdWQuY2FseXB0aWEuY29tL3BpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS0vQU9oMTRHaUwzLVRGUnQ2RG8zMVlnNXlJc1hXdzJ4cTJXVEVEb3BsMTduajc9czk2LWMiLCJpc3MiOiJodHRwczovL3Nzby5jYWx5cHRpYS5jb20vIiwic3ViIjoiZ29vZ2xlLW9hdXRoMnwxMDM2OTk4OTQ1MTI5OTE3MjY1OTQiLCJhdWQiOlsiaHR0cHM6Ly9jb25maWcuY2FseXB0aWEuY29tIiwiaHR0cHM6Ly9kZXYtMTVzbWpoLWUudXMuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTY1MDkwODMzOCwiZXhwIjoxNjUxNDY4MzM4LCJhenAiOiJoT0R0dkMzb09RVndUOElMeG9RRnY1ZVJ0Z0Vsc2RGaCIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgb2ZmbGluZV9hY2Nlc3MifQ.CZ3rMG9L6tjzZCjq92MIrRxCNXzrNfr0BP_0I-NU2p25qfvp4GiUMnqbLvlLEc50xissREuHl7jvL3oGMZpGizWWWzmcv0s68UnPazmKfG0eyLIR2Q-BDNjRKPAomBx4mYqxvVjUVPKIDg_ibi7SY4rR_UDIJLCKvhXfBw8l46zoLe302OPaDAbYLNxXSnHEo-GH5r5N_B-_p8Omh74xE5sHrX5TZ-z_MRrgFKiMp5Twk7DJXPkMPnv8wIbagCI4gD7cjuMn7CQLv-XOpSCx7ax-dhu-LpkwfBCGe_4ygnSjCEOvH8aqM_Rho6IkZNjlcRb2STHJ_u3TFyWk4SLn0g',
        },
      })
      .catch((e) => {
        console.log('>>>>>>>>>>>>>>>>>>>>>>error in dorequest');
        console.log(e);
      });
    console.log('>>>>>>>>>>>>>>>>>>>>>>result in dorequest');
    console.log(result);
    return result;
  }
}
