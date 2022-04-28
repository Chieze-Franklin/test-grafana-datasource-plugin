import defaults from 'lodash/defaults';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';

import { MyQuery, MyDataSourceOptions, defaultQuery } from './types';
import { ProjectMetrics } from 'metrics/types';
import { fetchApiData, setProxyUrl } from 'utils';
import { createFrameSetsFromProjectMetrics } from 'metrics/utils/project-metrics';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  proxyUrl?: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);

    this.proxyUrl = instanceSettings.url;
    setProxyUrl(this.proxyUrl);
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const promises = options.targets.map(async (target) => {
      const query = defaults(target, defaultQuery);
      const { metricType, metric, project, plugin } = query;
      const { duration, interval } = query;
      const { frame: cachedFrame } = query;

      let frame = new MutableDataFrame({
        refId: query.refId,
        ...(plugin && metric && { name: `${plugin}.${metric}` }),
        fields: [
          { name: 'time', type: FieldType.time },
          { name: 'value', type: FieldType.number },
        ],
      });

      if (query.hide) {
        return new Promise((res) => res(frame));
      }

      if (cachedFrame) {
        return new Promise((res) => res(cachedFrame));
      }

      let url: string | undefined = undefined;

      if (metricType === 'project' && project) {
        url = `${this.proxyUrl}/calyptia/v1/projects/${project}/metrics?start=-${duration}h&interval=${interval}h`;
      }

      if (!url) {
        return new Promise((res) => res(frame));
      }

      return fetchApiData(url)
        .then((response) => {
          // @ts-ignore
          const data: ProjectMetrics = response.data;

          if (metricType === 'project') {
            const frameSets = createFrameSetsFromProjectMetrics(data, query.refId);

            let frameSet = frameSets.find((fs) => fs.plugin === plugin && fs.metric === metric);

            if (!frameSet) {
              frameSet = frameSets[0];
            }

            if (frameSet) {
              frame = frameSet.frame;
            }
          }

          return frame;
        })
        .catch((e) => {
          console.log('>>>>>>>>>>>>>>>>>>>>>>error in query');
          console.log(e);
        });
    });

    return Promise.all(promises).then((data) => {
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
}
