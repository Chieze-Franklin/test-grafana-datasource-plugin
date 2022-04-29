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
import { fetchApiData, getQueryDuration, setProxyUrl, setQueryDuration } from 'utils';
import { createFrameSetsFromProjectMetrics } from 'metrics/utils/project-metrics';
import { AggregatorMetrics } from 'metrics/types/AggregatorMetrics';
import { createFrameSetsFromAggregatorMetrics } from 'metrics/utils/aggregator-metrics';
import { DataFrameSet } from 'metrics/types/DataFrameSet';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  proxyUrl?: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);

    this.proxyUrl = instanceSettings.url;
    setProxyUrl(this.proxyUrl);
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    let useCachedFrame = true;
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();
    // duration of the time range, in milliseconds.
    let duration = to - from;
    // convert duration to hour
    duration = duration / (1000 * 60 * 60);
    duration = Math.ceil(duration);
    if (getQueryDuration() !== duration) {
      useCachedFrame = false;
    }
    setQueryDuration(duration);

    const promises = options.targets.map(async (target) => {
      const query = defaults(target, defaultQuery);
      const { metricType, aggregator, metric, project, plugin } = query;
      // const { interval } = query;
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

      if (cachedFrame && useCachedFrame) {
        return new Promise((res) => res(cachedFrame));
      }

      let url: string | undefined = undefined;

      if (metricType === 'project' && project) {
        url = `${this.proxyUrl}/calyptia/v1/projects/${project}/metrics?start=-${duration}h&interval=1h`;
      } else if (metricType === 'aggregator' && aggregator) {
        url = `${this.proxyUrl}/calyptia/v1/aggregator_metrics/${aggregator}?start=-${duration}h&interval=1h`;
      }

      if (!url) {
        return new Promise((res) => res(frame));
      }

      return fetchApiData(url)
        .then((response) => {
          let frameSets: DataFrameSet[] = [];

          if (metricType === 'aggregator') {
            // @ts-ignore
            const data: AggregatorMetrics = response.data;
            frameSets = createFrameSetsFromAggregatorMetrics(data, query.refId);
          } else if (metricType === 'project') {
            // @ts-ignore
            const data: ProjectMetrics = response.data;
            frameSets = createFrameSetsFromProjectMetrics(data, query.refId);
          }

          let frameSet = frameSets.find((fs) => fs.plugin === plugin && fs.metric === metric);
          if (!frameSet) {
            frameSet = frameSets[0];
          }
          if (frameSet) {
            frame = frameSet.frame;
          }
          query.frame = frame;

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
