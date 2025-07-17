import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import {
  BehaviorSubject,
  Observable,
  EMPTY,
  debounceTime,
  map,
  startWith,
  switchMap,
} from 'rxjs';

export class PaginatedDataSource<T> extends DataSource<T> {
  private dataStream = new BehaviorSubject<T[]>([]);

  private fetchedEntities = new Set<number>();
  readonly fetch;
  readonly initialBuffer: number | undefined;

  totalCount = 0;

  constructor(init: {
    initialBuffer?: number;
    fetch: (pagination: {
      from: number;
      to: number;
    }) => Observable<{ results: T[]; totalCount: number }>;
  }) {
    super();
    this.fetch = init.fetch;
    this.initialBuffer = init.initialBuffer ?? 15;
  }

  connect(collectionViewer: CollectionViewer): Observable<T[]> {
    return collectionViewer.viewChange.pipe(
      debounceTime(500),
      switchMap(({ start, end }) => this.fetchPage(start, end)),
      startWith([...Array(this.initialBuffer).map(() => null as T)])
    );
  }

  disconnect(): void {}

  private fetchPage(from: number, to: number) {
    let isCached = true;

    for (let i = from; i <= to; i++) {
      if (!this.fetchedEntities.has(i)) {
        isCached = false;
        break;
      }
    }

    if (isCached) {
      return EMPTY;
    }

    return this.fetch({ from, to }).pipe(
      map(({ results, totalCount }) => {
        let cache = this.dataStream.value;
        this.totalCount = totalCount;

        if (cache.length !== totalCount) {
          cache = Array.from<T>({ length: totalCount });
          this.fetchedEntities.clear();
        }

        for (let i = from; i <= to; i++) {
          this.fetchedEntities.add(i);
        }

        cache.splice(from, to, ...results);

        return cache;
      })
    );
  }
}
